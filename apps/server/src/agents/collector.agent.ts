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
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', type: 'RSS', name: 'BBC Business' },
  { url: 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', type: 'RSS', name: 'NYT Business' },
  { url: 'https://www.infomoney.com.br/feed/', type: 'RSS', name: 'InfoMoney' },
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

    for (const source of this.sources) {
      try {
        const items = await this.collectFromSource(source);
        itemsProcessed += items;
      } catch (error) {
        errors.push({
          code: 'SOURCE_FAILED',
          message: `${source.name}: ${(error as Error).message}`,
          retryable: true,
          context: { sourceUrl: source.url },
        });
        log.warn({ source: source.name, error }, 'Source collection failed');
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
            rawMetadata: item.metadata,
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
          rawMetadata: result.metadata,
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
