import api from './api';
import { NotificationItem } from '../types/notification.types';

export const notificationService = {
  async getNotifications(): Promise<NotificationItem[]> {
    try {
      const res = await api.get<{ notifications: NotificationItem[] }>('/notifications');
      return res.data.notifications ?? [];
    } catch {
      return [];
    }
  },

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async markAllAsRead() { return notificationService.markAllRead(); },

  async getUnreadCount(): Promise<number> {
    try {
      const res = await api.get<{ count: number }>('/notifications/unread-count');
      return res.data.count ?? 0;
    } catch {
      return 0;
    }
  },
};
