/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Collector Agent
 * ═══════════════════════════════════════════
 * Scrapes data from configured sources (RSS, web, APIs).
 * Saves raw content to the database for classification.
 */

import { PrismaClient, DataSourceType } from '@prisma/client';
import type { AgentResult, AgentJobPayload } from '@b2b/shared';
import type { IAgent } from './types';
import { ScraperService } from '../services/scraper.service';
import { createLogger } from '../utils/logger';

const log = createLogger('collector-agent');

/** Data source configuration */
interface SourceConfig {
  url: string;
  type: DataSourceType;
  name: string;
}

/** Default sources to monitor */
const DEFAULT_SOURCES: SourceConfig[] = [
  // Jornais de Economia e Negócios (Nacionais)
  { url: 'https://www.infomoney.com.br/feed/',                   type: 'RSS', name: 'InfoMoney' },
  { url: 'https://valor.globo.com/rss/valor-economia/',         type: 'RSS', name: 'Valor Econômico' },
  { url: 'https://exame.com/feed/',                              type: 'RSS', name: 'Exame' },
  { url: 'https://www.moneytimes.com.br/feed/',                 type: 'RSS', name: 'Money Times' },
  { url: 'https://www.istoedinheiro.com.br/feed/',              type: 'RSS', name: 'IstoÉ Dinheiro' },
  { url: 'https://g1.globo.com/rss/g1/economia/',               type: 'RSS', name: 'G1 Economia' },
  { url: 'https://rss.uol.com.br/feed/economia.xml',            type: 'RSS', name: 'UOL Economia' },
  { url: 'https://feeds.folha.uol.com.br/mercado/rss.xml',      type: 'RSS', name: 'Folha Mercado' },
  { url: 'https://www.estadao.com.br/rss/ultimas/economia.xml', type: 'RSS', name: 'Estadão Economia' },
  { url: 'https://www.cnnbrasil.com.br/economia/feed/',         type: 'RSS', name: 'CNN Brasil Economia' },

  // Agronegócio (Grãos, Carnes, Bioenergia)
  { url: 'https://g1.globo.com/rss/g1/agro/',                   type: 'RSS', name: 'G1 Agro' },
  { url: 'https://www.canalrural.com.br/feed/',                 type: 'RSS', name: 'Canal Rural' },
  { url: 'https://www.noticiasagricolas.com.br/rss/ultimas-noticias/', type: 'RSS', name: 'Notícias Agrícolas' },
  { url: 'https://www.agrolink.com.br/rss/noticias.xml',        type: 'RSS', name: 'Agrolink' },
  { url: 'https://revistagloborural.globo.com/rss/ultimas/',    type: 'RSS', name: 'Globo Rural' },
  { url: 'https://www.comprerural.com/feed/',                   type: 'RSS', name: 'Compre Rural' },
  { url: 'https://forbes.com.br/category/forbesagro/feed/',     type: 'RSS', name: 'Forbes Agro' },

  // Energia, Óleo, Mineração e Indústria de Base
  { url: 'https://epbr.com.br/feed/',                           type: 'RSS', name: 'EPBR (Energia e Petróleo)' },
  { url: 'https://www.canalenergia.com.br/feed',                type: 'RSS', name: 'Canal Energia' },
  { url: 'https://www.noticiasdemineracao.com/rss',             type: 'RSS', name: 'Notícias de Mineração' },
  { url: 'https://oilprice.com/rss/main',                       type: 'RSS', name: 'OilPrice.com (Global)' },

  // Logística, Portos e Cadeia de Suprimentos
  { url: 'https://www.portosenavios.com.br/rss',                type: 'RSS', name: 'Portos e Navios' },

  // Cotações Internacionais e Mercado Global
  { url: 'https://br.investing.com/rss/commodities.rss',        type: 'RSS', name: 'Investing.com (Commodities)' },
  { url: 'https://br.investing.com/rss/news_1.rss',             type: 'RSS', name: 'Investing.com (Câmbio/Forex)' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml',      type: 'RSS', name: 'BBC Business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', type: 'RSS', name: 'NYT Business' },
  { url: 'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml',     type: 'RSS', name: 'WSJ Business' },
  { url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?profile=12000000&id=100727362', type: 'RSS', name: 'CNBC World' },
];

export class CollectorAgent implements IAgent {
  readonly name = 'collector' as const;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly scraper: ScraperService,
    private readonly sources: SourceConfig[] = DEFAULT_SOURCES
  ) {}

  async execute(payload: AgentJobPayload): Promise<AgentResult> {
    const errors: AgentResult['errors'] = [];
    let itemsProcessed = 0;
    const startTime = Date.now();

    log.info({ sourceCount: this.sources.length, trigger: payload.triggeredBy }, 'Collection started');

    const results = await Promise.allSettled(
      this.sources.map(async (source) => {
        try {
          const items = await this.collectFromSource(source);
          return items;
        } catch (error) {
          errors.push({
            code: 'SOURCE_FAILED',
            message: `${source.name}: ${(error as Error).message}`,
            retryable: true,
            context: { sourceUrl: source.url },
          });
          log.warn(`⚠️ Aviso: A fonte ${source.name} falhou temporariamente (${(error as Error).message})`);
          return 0;
        }
      })
    );

    for (const res of results) {
      if (res.status === 'fulfilled') {
        itemsProcessed += res.value;
      }
    }

    return {
      success: errors.length < this.sources.length, // Success if at least one source worked
      agentName: this.name,
      itemsProcessed,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  private async collectFromSource(source: SourceConfig): Promise<number> {
    let saved = 0;

    if (source.type === 'RSS') {
      const items = await this.scraper.parseRSSFeed(source.url);

      for (const item of items) {
        // Skip duplicates
        const exists = await this.prisma.rawData.findFirst({
          where: { sourceUrl: item.url },
          select: { id: true },
        });
        if (exists) continue;

        await this.prisma.rawData.create({
          data: {
            sourceType: source.type,
            sourceUrl: item.url,
            title: item.title,
            content: item.content,
            rawMetadata: item.metadata as any,
          },
        });
        saved++;
      }
    } else if (source.type === 'WEB_SCRAPE') {
      const result = await this.scraper.scrapeWebPage(source.url);

      await this.prisma.rawData.create({
        data: {
          sourceType: source.type,
          sourceUrl: result.url,
          title: result.title,
          content: result.content,
          rawMetadata: result.metadata as any,
        },
      });
      saved++;
    }

    log.info({ source: source.name, saved }, 'Source collected');
    return saved;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
