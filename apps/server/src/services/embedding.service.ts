/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Embedding Service
 * ═══════════════════════════════════════════
 * Generates vector embeddings via OpenAI with batching,
 * retry logic, and in-memory cache.
 */

import OpenAI from 'openai';
import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { EmbeddingError } from '../utils/errors';

const log = createLogger('embedding-service');

/** Maximum texts per batch (OpenAI limit) */
const MAX_BATCH_SIZE = 100;

/** Maximum retry attempts for transient errors */
const MAX_RETRIES = 3;

/** Simple LRU-like cache for repeated embeddings */
const embeddingCache = new Map<string, number[]>();
const CACHE_MAX_SIZE = 1000;

export class EmbeddingService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new OpenAI({ apiKey: apiKey ?? env.OPENAI_API_KEY });
    this.model = model ?? env.OPENAI_EMBEDDING_MODEL;
  }

  /**
   * Generate embedding for a single text.
   * Uses cache if available.
   */
  async embed(text: string): Promise<number[]> {
    const cacheKey = this.getCacheKey(text);
    const cached = embeddingCache.get(cacheKey);
    if (cached) {
      log.debug({ textLength: text.length }, 'Embedding cache hit');
      return cached;
    }

    const [embedding] = await this.embedBatch([text]);
    if (!embedding) {
      throw new EmbeddingError('Failed to generate embedding: empty result');
    }
    return embedding;
  }

  /**
   * Generate embeddings for multiple texts in optimized batches.
   * Automatically chunks into MAX_BATCH_SIZE groups.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);
      const embeddings = await this.callWithRetry(batch);
      allEmbeddings.push(...embeddings);
    }

    // Cache results
    texts.forEach((text, index) => {
      const embedding = allEmbeddings[index];
      if (embedding) {
        this.addToCache(text, embedding);
      }
    });

    return allEmbeddings;
  }

  /**
   * Calls OpenAI embeddings API with exponential backoff retry.
   */
  private async callWithRetry(texts: string[], attempt = 1): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      log.info(
        { count: texts.length, tokens: response.usage.total_tokens },
        'Embeddings generated'
      );

      return response.data.map((d) => d.embedding);
    } catch (error) {
      const isRetryable =
        error instanceof OpenAI.RateLimitError ||
        error instanceof OpenAI.InternalServerError ||
        error instanceof OpenAI.APIConnectionError;

      if (isRetryable && attempt < MAX_RETRIES) {
        const delayMs = Math.pow(2, attempt) * 1000;
        log.warn({ attempt, delayMs, error }, 'Embedding call failed, retrying...');
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return this.callWithRetry(texts, attempt + 1);
      }

      log.error({ error, attempt }, 'Embedding generation failed permanently');
      throw new EmbeddingError(
        `Embedding failed after ${attempt} attempts: ${(error as Error).message}`,
        { attempt, textCount: texts.length }
      );
    }
  }

  private getCacheKey(text: string): string {
    return `${this.model}:${text.slice(0, 200)}`;
  }

  private addToCache(text: string, embedding: number[]): void {
    if (embeddingCache.size >= CACHE_MAX_SIZE) {
      // Remove oldest entry
      const firstKey = embeddingCache.keys().next().value;
      if (firstKey) embeddingCache.delete(firstKey);
    }
    embeddingCache.set(this.getCacheKey(text), embedding);
  }
}

/** Default singleton instance */
export const embeddingService = new EmbeddingService();
