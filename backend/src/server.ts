import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import app from './app';
import { env } from './config/env';
import prisma, { startConnectionKeepalive, stopConnectionKeepalive } from './config/database';
import logger from './config/logger';
import { hashPassword, normalizeEmail } from './utils/crypto';
import { seedDatabase } from './startup/seed';
import { db } from './db/store';

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1 — Apply database schema (prisma db push)
// Uses direct node call to avoid shell wrapper permission issues on Render.
// Safe to run on every deploy — idempotent, never deletes data.
// Uses DIRECT_URL (non-pooled) — pgbouncer doesn't support DDL statements.
// ─────────────────────────────────────────────────────────────────────────────
function applyDatabaseSchema(): void {
  logger.info('📦 Applying database schema (prisma db push)...');
  try {
    execSync(
      'node node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss=false',
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          // For db push, use the DIRECT_URL if set (bypasses pgbouncer for DDL)
          DATABASE_URL: process.env.DIRECT_URL || process.env.DATABASE_URL,
        },
      }
    );
    logger.info('✅ Database schema is up to date.');
  } catch (err) {
    logger.error('❌ prisma db push failed — server cannot start safely.', err);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 2 — Bootstrap admin account
// Creates the initial admin only if it does not already exist.
// Never overwrites an existing admin password.
// ─────────────────────────────────────────────────────────────────────────────
async function bootstrapAdmin(): Promise<void> {
  try {
    const adminEmailNormalized = normalizeEmail(env.ADMIN_EMAIL);
    const existingAdmin = await prisma.user.findUnique({
      where: { emailNormalized: adminEmailNormalized },
    });

    if (!existingAdmin) {
      const passwordHash = await hashPassword(env.ADMIN_INITIAL_PASSWORD);
      await prisma.user.create({
        data: {
          name:            env.ADMIN_NAME,
          email:           env.ADMIN_EMAIL,
          emailNormalized: adminEmailNormalized,
          passwordHash,
          role:            'ADMIN',
          accountStatus:   'ACTIVE',
          emailVerified:   true,
          displayName:     env.ADMIN_NAME,
          anonymousAlias:  'Administrator',
        },
      });
      logger.info('✅ Admin account bootstrapped.');
    } else {
      logger.info('✓ Admin account already exists — skipping bootstrap.');
    }
  } catch (err) {
    logger.error('Error during admin bootstrap: %o', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 3 — Seed reference data (curriculum + grade scale)
// Idempotent: only inserts rows that are missing. Safe on every restart.
// ─────────────────────────────────────────────────────────────────────────────
async function runSeed(): Promise<void> {
  await seedDatabase(prisma);
}

// ─────────────────────────────────────────────────────────────────────────────
// STEP 4 — Bootstrap admin in the in-memory store
// Auth routes use db.users (not Prisma) so we must also seed the admin there.
// ─────────────────────────────────────────────────────────────────────────────
async function bootstrapInMemoryAdmin(): Promise<void> {
  try {
    const exists = db.users.find(
      (u) => u.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase()
    );
    if (!exists) {
      const passwordHash = await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 12);
      db.users.push({
        id: 'admin-' + Date.now(),
        name: env.ADMIN_NAME,
        email: env.ADMIN_EMAIL,
        password: passwordHash,
        role: 'ADMIN',
        isEmailVerified: true,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      });
      logger.info('✅ In-memory admin user bootstrapped.');
    }
  } catch (err) {
    logger.error('Error during in-memory admin bootstrap: %o', err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup sequence
// ─────────────────────────────────────────────────────────────────────────────
async function initialize(): Promise<void> {
  // 1. Apply schema (must run before any Prisma queries)
  applyDatabaseSchema();

  // 2. Explicitly connect so we catch connection errors before accepting traffic
  try {
    await prisma.$connect();
    logger.info('✅ Database connection established.');
  } catch (err) {
    logger.error('❌ Cannot connect to database: %o', err);
    process.exit(1);
  }

  // 3. Bootstrap admin + seed run in parallel (independent operations)
  await Promise.all([bootstrapAdmin(), runSeed()]);

  // 4. Sync admin into in-memory store for JWT-based auth routes
  await bootstrapInMemoryAdmin();

  logger.info('🟢 All startup checks passed.');
}

// ─────────────────────────────────────────────────────────────────────────────
// Start server — initialization runs before accepting any traffic
// ─────────────────────────────────────────────────────────────────────────────
initialize()
  .then(() => {
    const server = app.listen(env.PORT, () => {
      logger.info(
        `🚀 Campus Connect backend running on port ${env.PORT} in ${env.NODE_ENV} mode`
      );

      // Start connection keepalive AFTER server is up
      // Pings Neon every 4 min to prevent idle connection closure
      startConnectionKeepalive();
    });

    // ── Graceful shutdown ────────────────────────────────────────────────────
    const handleGracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      stopConnectionKeepalive();
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      });

      // Force-kill after 10 s if connections don't drain
      setTimeout(() => {
        logger.error('Could not close connections in time — forcefully shutting down.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => handleGracefulShutdown('SIGINT'));

    // ── Unhandled rejection guard ────────────────────────────────────────────
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled promise rejection: %o', reason);
      // Don't crash — log and continue. Prisma connection errors are recoverable.
    });
  })
  .catch((err) => {
    logger.error('❌ Fatal error during server initialization: %o', err);
    process.exit(1);
  });
