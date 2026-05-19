/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Prisma Client Singleton
 * ═══════════════════════════════════════════
 * Ensures only one PrismaClient instance exists per process.
 * Prevents connection pool exhaustion during hot-reload.
 */

import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client with query logging in development.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    datasourceUrl: env.DATABASE_URL,
  });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
