import { Request, Response } from 'express';
import prisma from '../config/database';
import { env } from '../config/env';

export class HealthController {
  public static async check(_req: Request, res: Response): Promise<void> {
    // ── Database ──────────────────────────────────────────────────────────────
    let dbStatus: 'connected' | 'disconnected' = 'disconnected';
    let dbError: string | undefined;
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (err: any) {
      dbError = err.message;
    }

    // ── OAuth ─────────────────────────────────────────────────────────────────
    const oauthConfigured =
      Boolean(env.GOOGLE_CLIENT_ID) && Boolean(env.GOOGLE_CLIENT_SECRET);

    // ── Email (SMTP) ──────────────────────────────────────────────────────────
    const emailConfigured =
      Boolean(process.env.SMTP_USER) && Boolean(process.env.SMTP_PASS);

    // ── Telegram ──────────────────────────────────────────────────────────────
    const telegramConfigured =
      Boolean(env.TELEGRAM_BOT_TOKEN) && Boolean(env.TELEGRAM_CHAT_ID);

    // ── AI ────────────────────────────────────────────────────────────────────
    const aiProvider = (env.AI_PROVIDER || 'MOCK').toUpperCase() as 'GEMINI' | 'OPENAI' | 'MOCK';
    let aiConfigured = false;
    if (aiProvider === 'GEMINI') {
      aiConfigured = Boolean(env.GEMINI_API_KEY);
    } else if (aiProvider === 'OPENAI') {
      aiConfigured = Boolean(env.OPENAI_API_KEY);
    } else {
      aiConfigured = true; // MOCK never needs a key
    }

    // ── Storage ───────────────────────────────────────────────────────────────
    const storageDriver = (env.STORAGE_DRIVER || 'LOCAL').toUpperCase() as 'LOCAL' | 'S3';

    // ── Overall status ────────────────────────────────────────────────────────
    const overallStatus = dbStatus === 'connected' ? 'ok' : 'degraded';

    const body: Record<string, any> = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbError
          ? { status: dbStatus, error: dbError }
          : { status: dbStatus },
        oauth: { status: oauthConfigured ? 'configured' : 'not_configured' },
        email: { status: emailConfigured ? 'configured' : 'not_configured' },
        telegram: { status: telegramConfigured ? 'configured' : 'not_configured' },
        ai: {
          status: aiConfigured ? 'configured' : 'not_configured',
          provider: aiProvider,
        },
        storage: { driver: storageDriver },
      },
    };

    res.status(overallStatus === 'ok' ? 200 : 503).json(body);
  }
}
