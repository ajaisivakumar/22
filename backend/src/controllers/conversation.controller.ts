import { Request, Response, NextFunction } from 'express';
import { OpportunityRepository } from '../repositories/opportunity.repository';
import prisma from '../config/database';

export class ConversationController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const conversations = await OpportunityRepository.getUserConversations(userId);
      res.status(200).json({ success: true, data: conversations });
    } catch (err) {
      next(err);
    }
  }

  public static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Verify participant
      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId: id, userId },
        },
      });

      if (!participant && req.user!.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Not authorized to view this conversation' });
        return;
      }

      const messages = await OpportunityRepository.getMessages(id);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  public static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: conversationId } = req.params;
      const { content } = req.body;
      const userId = req.user!.id;

      const participant = await prisma.conversationParticipant.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      });

      if (!participant) {
        res.status(403).json({ success: false, message: 'You are not a participant in this conversation' });
        return;
      }

      const message = await OpportunityRepository.createMessage(conversationId, userId, content);
      res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id: conversationId } = req.params;
      const userId = req.user!.id;

      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          readAt: null,
        },
        data: {
          readAt: new Date(),
        },
      });

      res.status(200).json({ success: true, message: 'Messages marked as read' });
    } catch (err) {
      next(err);
    }
  }
}
