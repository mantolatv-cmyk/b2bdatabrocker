/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Classifier Agent
 * ═══════════════════════════════════════════
 * Processes raw data collected by the Collector:
 * 1. Filters irrelevant content via LLM
 * 2. Generates embeddings for relevant content
 * 3. Saves to VectorKnowledge table (pgvector)
 */

import { PrismaClient } from '@prisma/client';
import type { AgentResult, AgentJobPayload } from '@b2b/shared';
import type { IAgent } from './types';
import { EmbeddingService } from '../services/embedding.service';
import { LLMService } from '../services/llm.service';
import { createLogger } from '../utils/logger';

const log = createLogger('classifier-agent');

const CLASSIFICATION_PROMPT = `Você é um classificador de dados de inteligência de mercado B2B.
Analise o texto abaixo e responda em JSON com exatamente estes campos:
{
  "isRelevant": boolean,    // true se é relevante para inteligência competitiva B2B
  "category": string,       // "mercado" | "regulatorio" | "tecnologia" | "concorrencia" | "macroeconomia" | "outro"
  "summary": string,        // Resumo em 2-3 frases do conteúdo relevante
  "discardReason": string   // Se isRelevant=false, explicar brevemente por quê
}

Critérios para DESCARTAR:
- Conteúdo puramente entretenimento/esportes/celebridades
- Notícias locais sem impacto econômico
- Conteúdo duplicado ou de baixa qualidade
- Spam ou conteúdo promocional sem valor informativo`;

const BATCH_SIZE = 10;

export class ClassifierAgent implements IAgent {
  readonly name = 'classifier' as const;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly embeddingService: EmbeddingService,
    private readonly llmService: LLMService
  ) {}

  async execute(payload: AgentJobPayload): Promise<AgentResult> {
    const errors: AgentResult['errors'] = [];
    let itemsProcessed = 0;
    const startTime = Date.now();

    // Fetch unprocessed raw data
    const rawItems = await this.prisma.rawData.findMany({
      where: { isProcessed: false, isDiscarded: false },
      orderBy: { collectedAt: 'asc' },
      take: 50,
    });

    log.info({ count: rawItems.length }, 'Classification started');

    // Process in batches
    for (let i = 0; i < rawItems.length; i += BATCH_SIZE) {
      const batch = rawItems.slice(i, i + BATCH_SIZE);

      for (const item of batch) {
        try {
          await this.classifyItem(item.id, item.content, item.title ?? '');
          itemsProcessed++;
        } catch (error) {
          errors.push({
            code: 'CLASSIFICATION_FAILED',
            message: `Item ${item.id}: ${(error as Error).message}`,
            retryable: true,
            context: { rawDataId: item.id },
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      agentName: this.name,
      itemsProcessed,
      errors,
      durationMs: Date.now() - startTime,
    };
  }

  private async classifyItem(id: string, content: string, title: string): Promise<void> {
    // Step 1: Classify via LLM
    const classificationRaw = await this.llmService.complete({
      systemPrompt: CLASSIFICATION_PROMPT,
      messages: [{ role: 'user', content: `TÍTULO: ${title}\n\nCONTEÚDO:\n${content.slice(0, 3000)}` }],
      temperature: 0.2,
    });

    let classification: {
      isRelevant: boolean;
      category: string;
      summary: string;
      discardReason?: string;
    };

    try {
      // Extract JSON from LLM response (may be wrapped in markdown code block)
      const jsonMatch = classificationRaw.match(/\{[\s\S]*\}/);
      classification = JSON.parse(jsonMatch?.[0] ?? classificationRaw);
    } catch {
      log.warn({ id, response: classificationRaw.slice(0, 200) }, 'Failed to parse LLM JSON');
      classification = { isRelevant: false, category: 'outro', summary: '', discardReason: 'Invalid LLM response' };
    }

    if (!classification.isRelevant) {
      // Mark as discarded
      await this.prisma.rawData.update({
        where: { id },
        data: {
          isProcessed: true,
          isDiscarded: true,
          processedAt: new Date(),
          discardReason: classification.discardReason ?? 'Not relevant',
        },
      });
      log.debug({ id, reason: classification.discardReason }, 'Item discarded');
      return;
    }

    // Step 2: Generate embedding
    const textForEmbedding = `${title}. ${classification.summary}`;
    const embedding = await this.embeddingService.embed(textForEmbedding);

    // Step 3: Save to VectorKnowledge
    const embeddingStr = `[${embedding.join(',')}]`;

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO vector_knowledge (id, raw_data_id, content, summary, embedding, category, relevance_score, created_at)
       VALUES ($1, $2, $3, $4, $5::vector, $6, $7, NOW())`,
      `vk_${id}`,
      id,
      content.slice(0, 10_000),
      classification.summary,
      embeddingStr,
      classification.category,
      0.8
    );

    // Mark raw data as processed
    await this.prisma.rawData.update({
      where: { id },
      data: { isProcessed: true, processedAt: new Date() },
    });

    log.info({ id, category: classification.category }, 'Item classified and vectorized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.embeddingService.embed('health check');
      return true;
    } catch {
      return false;
    }
  }
}
