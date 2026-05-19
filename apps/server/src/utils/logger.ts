/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Logger (Pino)
 * ═══════════════════════════════════════════
 * Structured logging with context support.
 */

import pino from 'pino';
import { env } from '../config/env';

/** Root logger instance */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
      : undefined,
  base: { service: 'b2b-databroker' },
});

/** Creates a child logger with a specific module context */
export function createLogger(module: string) {
  return logger.child({ module });
}
