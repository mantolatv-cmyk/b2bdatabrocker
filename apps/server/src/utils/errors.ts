/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Custom Error Classes
 * ═══════════════════════════════════════════
 * Structured errors with codes for consistent error handling.
 */

/** Base error for all application errors */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, unknown>;

  constructor(params: {
    message: string;
    code: string;
    statusCode?: number;
    isOperational?: boolean;
    context?: Record<string, unknown>;
  }) {
    super(params.message);
    this.name = this.constructor.name;
    this.code = params.code;
    this.statusCode = params.statusCode ?? 500;
    this.isOperational = params.isOperational ?? true;
    this.context = params.context;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** LLM API call failed (rate limit, timeout, invalid response) */
export class LLMError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({ message, code: 'LLM_ERROR', statusCode: 502, context });
  }
}

/** Embedding generation failed */
export class EmbeddingError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({ message, code: 'EMBEDDING_ERROR', statusCode: 502, context });
  }
}

/** Scraping/collection failed */
export class ScraperError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({ message, code: 'SCRAPER_ERROR', statusCode: 502, context });
  }
}

/** Agent pipeline error */
export class AgentError extends AppError {
  public readonly agentName: string;
  public readonly retryable: boolean;

  constructor(params: {
    message: string;
    agentName: string;
    retryable?: boolean;
    context?: Record<string, unknown>;
  }) {
    super({
      message: params.message,
      code: 'AGENT_ERROR',
      statusCode: 500,
      context: params.context,
    });
    this.agentName = params.agentName;
    this.retryable = params.retryable ?? false;
  }
}

/** Resource not found */
export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super({
      message: `${resource} with id '${id}' not found`,
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }
}

/** Rate limit exceeded */
export class RateLimitError extends AppError {
  public readonly retryAfterMs: number;

  constructor(retryAfterMs: number) {
    super({
      message: `Rate limit exceeded. Retry after ${retryAfterMs}ms`,
      code: 'RATE_LIMIT',
      statusCode: 429,
    });
    this.retryAfterMs = retryAfterMs;
  }
}
