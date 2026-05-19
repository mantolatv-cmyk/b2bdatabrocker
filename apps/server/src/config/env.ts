/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Environment Configuration
 * ═══════════════════════════════════════════
 * Validates all environment variables at startup using Zod.
 * Fails fast if any required variable is missing.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis URL'),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_COMPLETION_MODEL: z.string().default('gpt-4o'),

  // Server
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('debug'),

  // Scraping
  SCRAPE_CRON_INTERVAL: z.string().default('*/30 * * * *'),
  MAX_CONCURRENT_SCRAPES: z.coerce.number().default(5),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Parses and validates environment variables.
 * Throws descriptive error if validation fails.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `  ✗ ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(`\n❌ Environment validation failed:\n${formatted}\n`);
    process.exit(1);
  }

  return result.data;
}

/** Validated environment variables — safe to use anywhere */
export const env = validateEnv();
