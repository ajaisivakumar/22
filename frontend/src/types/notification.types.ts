export type NotificationType = 'POLL' | 'EVENT' | 'PARTNER' | 'LOSTFOUND' | 'COMPLAINT' | 'SYSTEM';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
