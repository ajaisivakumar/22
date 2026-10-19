import prisma from '../config/database';
import { Notification } from '@prisma/client';

export class NotificationRepository {
  public static async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    body?: string;
    relatedId?: string;
    relatedType?: string;
  }): Promise<Notification> {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body || null,
        relatedId: data.relatedId || null,
        relatedType: data.relatedType || null,
      },
    });
  }

  public static async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  public static async markAsRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  public static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}
