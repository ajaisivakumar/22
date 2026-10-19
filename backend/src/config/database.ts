import { PrismaClient } from '@prisma/client';
import logger from './logger';

// ─────────────────────────────────────────────────────────────────────────────
// Prisma singleton with Neon-compatible connection handling.
//
// Problem: Neon serverless PostgreSQL closes idle connections after ~5 minutes.
// When Render's free instance wakes from sleep, existing pooled connections
// are stale → "Error { kind: Closed, cause: None }"
//
// Solution:
//  1. Use Neon's pooler URL (pgbouncer) for DATABASE_URL — short-lived connections
//  2. Keep connections alive with a periodic lightweight ping
//  3. Auto-reconnect on connection errors
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? [{ emit: 'stdout', level: 'query' }, { emit: 'stdout', level: 'error' }, { emit: 'stdout', level: 'warn' }]
      : [{ emit: 'stdout', level: 'error' }],
  });
}

export const prisma: PrismaClient = global.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// ── Connection keepalive ──────────────────────────────────────────────────────
// Ping every 4 minutes to prevent Neon from closing idle connections.
// If the ping fails (connection was closed), force a reconnect.
let keepAliveTimer: NodeJS.Timeout | null = null;

export function startConnectionKeepalive(): void {
  if (keepAliveTimer) return; // already running

  const INTERVAL_MS = 4 * 60 * 1000; // 4 minutes (Neon closes at 5 min)

  keepAliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err: any) {
      logger.warn('Keepalive ping failed — reconnecting to database...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        logger.info('Database reconnected successfully.');
      } catch (reconnectErr) {
        logger.error('Database reconnect failed: %o', reconnectErr);
      }
    }
  }, INTERVAL_MS);

  // Don't let this timer prevent graceful shutdown
  keepAliveTimer.unref();
  logger.info('🔁 Database keepalive started (ping every 4 min).');
}

export function stopConnectionKeepalive(): void {
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
}

// ── Resilient query wrapper ───────────────────────────────────────────────────
// Wraps any Prisma operation: on connection-closed error, reconnects and retries once.
export async function withRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (err: any) {
    const isClosedError =
      err?.message?.includes('kind: Closed') ||
      err?.message?.includes('connection closed') ||
      err?.code === 'P1017' || // Prisma: server closed connection
      err?.code === 'P2024';   // Prisma: connection pool timeout

    if (isClosedError) {
      logger.warn('Stale connection detected — reconnecting...');
      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch {
        // ignore reconnect errors — let the original error propagate
      }
      return await operation(); // retry once
    }
    throw err;
  }
}

export default prisma;
