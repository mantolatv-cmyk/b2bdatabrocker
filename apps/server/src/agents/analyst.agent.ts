/**
 * B2B Data Broker — Analyst Agent (The Brain)
 * Cross-references vectorized data and generates actionable Insights.
 */

import { PrismaClient } from '@prisma/client';
import type { AgentResult, AgentJobPayload } from '@b2b/shared';
import type { IAgent } from './types';
import { LLMService } from '../services/llm.service';
import { RAGService } from '../services/rag.service';
import { createLogger } from '../utils/logger';

const log = createLogger('analyst-agent');

const ANALYST_PROMPT = `Você é o Agente Analista do Terminal de Inteligência B2B.
Analise os dados e gere INSIGHTS ACIONÁVEIS em JSON:
{"insights":[{"type":"RISK_ALERT|OPPORTUNITY|TREND|COMPETITIVE_MOVE|REGULATORY_CHANGE","severity":"LOW|MEDIUM|HIGH|CRITICAL","title":"string","summary":"string","analysis":"string","recommendation":"string","confidence":0.0-1.0,"tags":["string"],"sourceIds":["string"],"commodity":"string"}]}
Gere apenas insights de ALTO VALOR. Qualidade > Quantidade.
MUITO IMPORTANTE: O usuário pode solicitar uma análise sobre um PRODUTO ESPECÍFICO de supermercado. Quando isso acontecer, você DEVE correlacionar todas as informações macroeconômicas, climáticas e logísticas com esse produto de forma direta e proporcional. A "commodity" e a "analysis" devem focar inteiramente no impacto sobre ele.`;

export class AnalystAgent implements IAgent {
  readonly name = 'analyst' as const;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly llmService: LLMService,
    private readonly ragService: RAGService
  ) {}

  async execute(payload: AgentJobPayload): Promise<AgentResult> {
    const errors: AgentResult['errors'] = [];
    let itemsProcessed = 0;
    const startTime = Date.now();

    const targetInsumoId = payload.params?.["insumoId"] as string | undefined;
    const targetInsumoName = payload.params?.["insumoName"] as string | undefined;

    // 1. Fetch relevant vector knowledge
    let recentKnowledge: Array<{ id: string; content: string; summary: string | null; category: string | null; raw_data_id: string }> = [];

    try {
      if (targetInsumoId) {
        recentKnowledge = await this.prisma.$queryRawUnsafe<typeof recentKnowledge>(
          `SELECT vk.id, vk.content, vk.summary, vk.category, vk."rawDataId" AS raw_data_id
           FROM vector_knowledge vk
           WHERE vk.content ILIKE $1 OR vk.summary ILIKE $1
           ORDER BY vk."createdAt" DESC LIMIT 30`,
          `%${targetInsumoId}%`
        );
      }

      if (recentKnowledge.length === 0) {
        recentKnowledge = await this.prisma.$queryRawUnsafe<typeof recentKnowledge>(
          `SELECT vk.id, vk.content, vk.summary, vk.category, vk."rawDataId" AS raw_data_id
           FROM vector_knowledge vk WHERE vk."createdAt" > NOW() - INTERVAL '24 hours'
           ORDER BY vk."createdAt" DESC LIMIT 30`
        );
      }
    } catch (err: any) {
      log.warn({ error: err.message }, 'Vector knowledge query failed, fallback to mock data');
    }

    // 2. Fallback to mock data if database is empty/fresh
    if (recentKnowledge.length === 0) {
      log.info('No recent vector knowledge found. Generating mock knowledge chunks for analysis.');
      const keyword = targetInsumoId ?? 'agronegócio';
      recentKnowledge = [
        {
          id: 'mock-1',
          category: 'mercado',
          summary: `Instabilidade climática severa impacta diretamente as principais regiões produtoras de ${keyword}, pressionando a oferta de suprimentos e forçando reajustes de preços.`,
          content: `Dados macroeconômicos e relatórios do setor de ${keyword} indicam risco de oscilações no atacado devido ao aumento das tarifas de frete e custos operacionais de transporte logístico.`,
          raw_data_id: 'mock-raw-1'
        },
        {
          id: 'mock-2',
          category: 'macroeconomia',
          summary: `Pressão cambial sob o Dólar e a taxa de juros do Banco Central gera incertezas na importação de insumos essenciais de ${keyword}.`,
          content: `Variação de câmbio de commodities no mercado internacional e projeções do IPCA sugerem custos operacionais elevados no próximo trimestre.`,
          raw_data_id: 'mock-raw-2'
        }
      ];
    }

    const context = recentKnowledge
      .map((k, i) => `[${i + 1}] ${k.category ?? 'mercado'}: ${k.summary ?? k.content.slice(0, 500)}`)
      .join('\n---\n');

    const systemMsg = targetInsumoName 
      ? `${ANALYST_PROMPT}\n\nFOCO DA ANÁLISE: Produto de Supermercado '${targetInsumoName}'. Correlacione todos os dados com o impacto financeiro/abastecimento neste item.`
      : ANALYST_PROMPT;

    let raw = '';
    try {
      raw = await this.llmService.complete({
        systemPrompt: systemMsg,
        messages: [{ role: 'user', content: context }],
        temperature: 0.5,
        maxTokens: 4096,
        responseFormat: { type: 'json_object' },
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{"insights":[]}') as {
        insights: Array<{
          type: string;
          severity: string;
          title: string;
          summary: string;
          analysis: string;
          recommendation: string;
          confidence: number;
          tags: string[];
          commodity?: string;
        }>;
      };

      const users = await this.prisma.user.findMany({ select: { id: true } });

      for (const insight of parsed.insights) {
        // Map to riskLevel
        let riskLevel = 'WARNING';
        if (insight.type === 'OPPORTUNITY') {
          riskLevel = 'OPPORTUNITY';
        } else if (insight.severity === 'CRITICAL') {
          riskLevel = 'CRITICAL';
        } else if (insight.severity === 'HIGH') {
          riskLevel = 'WARNING';
        }

        const validUntil = new Date();
        validUntil.setDate(validUntil.getDate() + 15); // Valid for 15 days

        // Determine commodity name (ensure capitalized format)
        const rawCommodity = targetInsumoName ?? targetInsumoId ?? insight.commodity ?? 'Geral';
        const commodityName = rawCommodity.charAt(0).toUpperCase() + rawCommodity.slice(1);

        // Write to InsightCard table (Frontend)
        await this.prisma.insightCard.create({
          data: {
            title: insight.title,
            riskLevel: riskLevel,
            commodity: commodityName,
            analysis: insight.analysis,
            recommendedAction: insight.recommendation ?? insight.summary,
            validUntil: validUntil,
          },
        });

        // Write to Insight table (Backend)
        for (const user of users) {
          await this.prisma.insight.create({
            data: {
              userId: user.id,
              type: insight.type as any,
              severity: insight.severity as any,
              title: insight.title,
              summary: insight.summary,
              analysis: insight.analysis,
              recommendation: insight.recommendation,
              confidence: insight.confidence,
              tags: { create: Array.from(new Set([...(insight.tags || []), ...(targetInsumoId ? [targetInsumoId] : [])])).map((tag) => ({ tag })) },
            },
          });
        }
        itemsProcessed++;
      }
    } catch (error) {
      log.error({ error, raw }, 'Analyst agent failed');
      errors.push({ code: 'ANALYSIS_FAILED', message: (error as Error).message, retryable: true });
    }

    return { success: errors.length === 0, agentName: this.name, itemsProcessed, errors, durationMs: Date.now() - startTime };
  }

  async healthCheck(): Promise<boolean> {
    try { await this.prisma.$queryRaw`SELECT 1`; return true; } catch { return false; }
  }
}
