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
{"insights":[{"type":"RISK_ALERT|OPPORTUNITY|TREND|COMPETITIVE_MOVE|REGULATORY_CHANGE","severity":"LOW|MEDIUM|HIGH|CRITICAL","title":"string","summary":"string","analysis":"string","recommendation":"string","confidence":0.0-1.0,"tags":["string"],"sourceIds":["string"]}]}
Gere apenas insights de ALTO VALOR. Qualidade > Quantidade.`;

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

    const recentKnowledge = await this.prisma.$queryRawUnsafe<
      Array<{ id: string; content: string; summary: string; category: string; raw_data_id: string }>
    >(
      `SELECT vk.id, vk.content, vk.summary, vk.category, vk.raw_data_id
       FROM vector_knowledge vk WHERE vk.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY vk.created_at DESC LIMIT 30`
    );

    if (recentKnowledge.length === 0) {
      return { success: true, agentName: this.name, itemsProcessed: 0, errors: [], durationMs: Date.now() - startTime };
    }

    const context = recentKnowledge
      .map((k, i) => `[${i + 1}] ${k.category}: ${k.summary ?? k.content.slice(0, 500)}`)
      .join('\n---\n');

    try {
      const raw = await this.llmService.complete({
        systemPrompt: ANALYST_PROMPT,
        messages: [{ role: 'user', content: context }],
        temperature: 0.5,
        maxTokens: 4096,
      });

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(jsonMatch?.[0] ?? '{"insights":[]}') as {
        insights: Array<{ type: string; severity: string; title: string; summary: string; analysis: string; recommendation: string; confidence: number; tags: string[] }>;
      };

      const users = await this.prisma.user.findMany({ select: { id: true } });

      for (const insight of parsed.insights) {
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
              tags: { create: insight.tags.map((tag) => ({ tag })) },
            },
          });
          itemsProcessed++;
        }
      }
    } catch (error) {
      errors.push({ code: 'ANALYSIS_FAILED', message: (error as Error).message, retryable: true });
    }

    return { success: errors.length === 0, agentName: this.name, itemsProcessed, errors, durationMs: Date.now() - startTime };
  }

  async healthCheck(): Promise<boolean> {
    try { await this.prisma.$queryRaw`SELECT 1`; return true; } catch { return false; }
  }
}
