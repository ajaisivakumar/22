import { Request, Response, NextFunction } from 'express';
import { NotificationRepository } from '../repositories/notification.repository';

export class NotificationController {
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const notifications = await NotificationRepository.getUserNotifications(userId);
      res.status(200).json({ success: true, data: notifications });
    } catch (err) {
      next(err);
    }
  }

  public static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      await NotificationRepository.markAsRead(id, userId);
      res.status(200).json({ success: true, message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  }

  public static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await NotificationRepository.markAllAsRead(userId);
      res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  }
}
