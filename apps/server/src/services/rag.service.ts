/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — RAG Service
 * ═══════════════════════════════════════════
 * Retrieval-Augmented Generation pipeline:
 * 1. Convert question → embedding
 * 2. Vector similarity search in PostgreSQL (pgvector)
 * 3. Build prompt with retrieved context
 * 4. Generate response via LLM (streaming or batch)
 */

import { PrismaClient } from '@prisma/client';
import { EmbeddingService } from './embedding.service';
import { LLMService } from './llm.service';
import { createLogger } from '../utils/logger';

const log = createLogger('rag-service');

/** A retrieved knowledge chunk with similarity score */
export interface RetrievedChunk {
  id: string;
  content: string;
  summary: string | null;
  category: string | null;
  similarity: number;
  sourceUrl?: string;
  sourceTitle?: string;
}

/** Configuration for the RAG pipeline */
export interface RAGConfig {
  /** Number of chunks to retrieve (default: 5) */
  topK?: number;
  /** Minimum similarity threshold (default: 0.7) */
  minSimilarity?: number;
  /** Maximum context length in characters (default: 8000) */
  maxContextLength?: number;
  /** Temperature for LLM generation (default: 0.7) */
  temperature?: number;
}

const DEFAULT_CONFIG: Required<RAGConfig> = {
  topK: 5,
  minSimilarity: 0.7,
  maxContextLength: 8000,
  temperature: 0.7,
};

/** System prompt for the RAG chatbot */
const RAG_SYSTEM_PROMPT = `Você é um analista de inteligência competitiva B2B de alto nível. 
Seu nome é "Atlas" e você faz parte do Terminal de Inteligência.

REGRAS:
- Responda SEMPRE em português brasileiro
- Base suas respostas EXCLUSIVAMENTE no contexto fornecido
- Se a informação não estiver no contexto, diga claramente: "Não encontrei dados suficientes na base para responder com precisão."
- Cite as fontes quando relevante
- Seja direto, objetivo e acionável
- Use dados numéricos e datas quando disponíveis
- Formate com markdown para melhor leitura
- Destaque riscos em **negrito** e oportunidades em *itálico*`;

export class RAGService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly embeddingService: EmbeddingService,
    private readonly llmService: LLMService
  ) {}

  /**
   * Performs vector similarity search using pgvector.
   * Uses cosine distance (<=> operator) for matching.
   */
  async retrieveContext(query: string, config?: RAGConfig): Promise<RetrievedChunk[]> {
    const { topK, minSimilarity } = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();

    // Step 1: Generate query embedding
    const queryEmbedding = await this.embeddingService.embed(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Step 2: Vector similarity search via raw SQL (pgvector cosine distance)
    const results = await this.prisma.$queryRawUnsafe<
      Array<{
        id: string;
        content: string;
        summary: string | null;
        category: string | null;
        similarity: number;
        source_url: string | null;
        source_title: string | null;
      }>
    >(
      `
      SELECT 
        vk.id,
        vk.content,
        vk.summary,
        vk.category,
        1 - (vk.embedding <=> $1::vector) as similarity,
        rd."sourceUrl" as source_url,
        rd.title as source_title
      FROM vector_knowledge vk
      JOIN raw_data rd ON rd.id = vk."rawDataId"
      WHERE 1 - (vk.embedding <=> $1::vector) >= $2
      ORDER BY vk.embedding <=> $1::vector
      LIMIT $3
      `,
      embeddingStr,
      minSimilarity,
      topK
    );

    const durationMs = Date.now() - startTime;
    log.info(
      { query: query.slice(0, 100), resultsCount: results.length, durationMs },
      'Vector search completed'
    );

    return results.map((r) => ({
      id: r.id,
      content: r.content,
      summary: r.summary,
      category: r.category,
      similarity: Number(r.similarity),
      sourceUrl: r.source_url ?? undefined,
      sourceTitle: r.source_title ?? undefined,
    }));
  }

  /**
   * Builds the context string from retrieved chunks.
   * Truncates to maxContextLength to avoid token overflow.
   */
  buildContext(chunks: RetrievedChunk[], maxLength: number): string {
    let context = '';
    let chunkIndex = 0;

    for (const chunk of chunks) {
      const entry = `\n--- Fonte ${chunkIndex + 1} (Relevância: ${(chunk.similarity * 100).toFixed(1)}%) ---\n${chunk.summary ?? chunk.content}\n`;

      if (context.length + entry.length > maxLength) break;
      context += entry;
      chunkIndex++;
    }

    return context;
  }

  /**
   * Full RAG pipeline: query → retrieve → generate (non-streaming).
   */
  async answer(query: string, config?: RAGConfig): Promise<{
    response: string;
    sources: RetrievedChunk[];
    retrievalTimeMs: number;
  }> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const retrievalStart = Date.now();

    const chunks = await this.retrieveContext(query, mergedConfig);
    const retrievalTimeMs = Date.now() - retrievalStart;

    const context = this.buildContext(chunks, mergedConfig.maxContextLength);

    const userMessage = `CONTEXTO DA BASE DE CONHECIMENTO:\n${context}\n\nPERGUNTA DO USUÁRIO:\n${query}`;

    const response = await this.llmService.complete({
      systemPrompt: RAG_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      temperature: mergedConfig.temperature,
    });

    return { response, sources: chunks, retrievalTimeMs };
  }

  /**
   * Full RAG pipeline with streaming response.
   * Returns an async generator for real-time output.
   */
  async *answerStream(query: string, config?: RAGConfig): AsyncGenerator<string> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    const chunks = await this.retrieveContext(query, mergedConfig);
    const context = this.buildContext(chunks, mergedConfig.maxContextLength);

    const userMessage = `CONTEXTO DA BASE DE CONHECIMENTO:\n${context}\n\nPERGUNTA DO USUÁRIO:\n${query}`;

    yield* this.llmService.stream({
      systemPrompt: RAG_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      temperature: mergedConfig.temperature,
    });
  }
}
