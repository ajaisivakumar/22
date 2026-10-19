import { Request, Response } from 'express';
import { env } from '../config/env';

export class HealthController {
  public static async check(_req: Request, res: Response): Promise<void> {
    const oauthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
    const emailConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
    const telegramConfigured = Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID);
    const aiProvider = (env.AI_PROVIDER || 'MOCK').toUpperCase();

    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: { status: 'memory' },
        oauth: { status: oauthConfigured ? 'configured' : 'not_configured' },
        email: { status: emailConfigured ? 'configured' : 'not_configured' },
        telegram: { status: telegramConfigured ? 'configured' : 'not_configured' },
        ai: { status: 'configured', provider: aiProvider },
        storage: { driver: env.STORAGE_DRIVER || 'LOCAL' },
      },
    });
  }
}
