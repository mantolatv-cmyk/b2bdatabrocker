/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — LLM Service
 * ═══════════════════════════════════════════
 * Abstraction over OpenAI completions with:
 * - Circuit breaker pattern
 * - Rate limiting
 * - Structured output support
 * - Streaming support
 */

import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { env } from '../config/env';
import { createLogger } from '../utils/logger';
import { LLMError, RateLimitError } from '../utils/errors';

const log = createLogger('llm-service');

/** Circuit breaker states */
type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  threshold: number;
  resetTimeMs: number;
}

export class LLMService {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly circuit: CircuitBreaker;

  constructor(apiKey?: string, model?: string) {
    const isDeepSeek = !!env.DEEPSEEK_API_KEY && (!env.OPENAI_API_KEY || env.OPENAI_API_KEY === 'sk-placeholder' || apiKey === 'sk-placeholder');
    const key = isDeepSeek ? env.DEEPSEEK_API_KEY : (apiKey ?? env.OPENAI_API_KEY);
    const baseURL = isDeepSeek ? (env.DEEPSEEK_API_URL ?? 'https://api.deepseek.com/v1') : undefined;

    this.client = new OpenAI({ apiKey: key, baseURL });
    this.model = isDeepSeek ? 'deepseek-chat' : (model ?? env.OPENAI_COMPLETION_MODEL);
    this.circuit = {
      state: 'closed',
      failures: 0,
      lastFailure: 0,
      threshold: 5,
      resetTimeMs: 60_000, // 1 minute
    };
  }

  /**
   * Generate a chat completion (non-streaming).
   */
  async complete(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    responseFormat?: { type: 'json_object' | 'text' };
  }): Promise<string> {
    this.checkCircuit();

    const messages: ChatCompletionMessageParam[] = [];

    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    messages.push(...params.messages);

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        response_format: params.responseFormat,
      });

      this.circuit.failures = 0;
      this.circuit.state = 'closed';

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new LLMError('LLM returned empty response');
      }

      log.info(
        { tokens: response.usage?.total_tokens, model: this.model },
        'LLM completion successful'
      );

      return content;
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generate a streaming chat completion.
   * Returns an async iterable of text chunks.
   */
  async *stream(params: {
    messages: ChatCompletionMessageParam[];
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }): AsyncGenerator<string> {
    this.checkCircuit();

    const messages: ChatCompletionMessageParam[] = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    messages.push(...params.messages);

    try {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        temperature: params.temperature ?? 0.7,
        max_tokens: params.maxTokens ?? 2048,
        stream: true,
      });

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          yield delta;
        }
      }

      this.circuit.failures = 0;
      this.circuit.state = 'closed';
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Circuit breaker check — prevents cascading failures.
   */
  private checkCircuit(): void {
    if (this.circuit.state === 'open') {
      const elapsed = Date.now() - this.circuit.lastFailure;
      if (elapsed > this.circuit.resetTimeMs) {
        log.info('Circuit breaker: transitioning to half-open');
        this.circuit.state = 'half-open';
      } else {
        throw new LLMError(
          `Circuit breaker is OPEN. Retry in ${Math.ceil((this.circuit.resetTimeMs - elapsed) / 1000)}s`
        );
      }
    }
  }

  /**
   * Handles LLM errors and updates circuit breaker state.
   */
  private handleError(error: unknown): never {
    this.circuit.failures++;
    this.circuit.lastFailure = Date.now();

    if (this.circuit.failures >= this.circuit.threshold) {
      this.circuit.state = 'open';
      log.error({ failures: this.circuit.failures }, 'Circuit breaker OPENED');
    }

    if (error instanceof OpenAI.RateLimitError) {
      const retryAfter = 60_000;
      log.warn({ retryAfter }, 'Rate limit hit');
      throw new RateLimitError(retryAfter);
    }

    log.error({ error }, 'LLM call failed');
    throw new LLMError(`LLM request failed: ${(error as Error).message}`);
  }
}

/** Default singleton instance */
export const llmService = new LLMService();
