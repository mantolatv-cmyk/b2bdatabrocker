/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Prisma Client Singleton
 * ═══════════════════════════════════════════
 * Centralized Prisma Client to prevent multiple instances
 * and connection pool exhaustion across the monorepo.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client with query logging in development.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env['NODE_ENV'] === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';
