import axios from 'axios';
import { env } from '../config/env';
import logger from '../config/logger';

export interface TelegramLabComplaintPayload {
  referenceId: string;
  floor: string;
  lab: string;
  systemNumber: string;
  description: string;
  createdAt: Date;
}

class TelegramService {
  private botToken = env.TELEGRAM_BOT_TOKEN;
  private chatId = env.TELEGRAM_CHAT_ID;

  public async sendLabComplaintNotification(payload: TelegramLabComplaintPayload): Promise<{ success: boolean; error?: string }> {
    const timestampIST = payload.createdAt.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: true,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const message = `🔴 NEW ANONYMOUS LAB COMPLAINT

Complaint ID: ${payload.referenceId}
Floor: ${payload.floor}
Lab: ${payload.lab}
System Number: ${payload.systemNumber}

Issue:
${payload.description}

Submitted: ${timestampIST} IST
Status: OPEN

Please inspect the reported system.`;

    if (!this.botToken || !this.chatId) {
      logger.info(`[TelegramService MOCK] Token/ChatId not configured. Message content:\n${message}`);
      return { success: true };
    }

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      await axios.post(url, {
        chat_id: this.chatId,
        text: message,
      });
      return { success: true };
    } catch (error: any) {
      const errMsg = error.response?.data?.description || error.message || 'Unknown Telegram error';
      logger.error('Telegram notification failed: %s', errMsg);
      return { success: false, error: errMsg };
    }
  }
}

export const telegramService = new TelegramService();
export default telegramService;
