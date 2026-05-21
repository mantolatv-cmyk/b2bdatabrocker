/**
 * ═══════════════════════════════════════════
 * B2B Data Broker — Prisma Client Singleton
 * ═══════════════════════════════════════════
 * Ensures only one PrismaClient instance exists per process.
 * Prevents connection pool exhaustion during hot-reload.
 */

export { prisma, prisma as default } from '@b2b/database';
