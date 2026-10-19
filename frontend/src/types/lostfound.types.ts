export type ItemType = 'LOST' | 'FOUND';
export type ItemStatus = 'OPEN' | 'CLAIMED' | 'RETURNED' | 'RESOLVED' | 'HIDDEN';

export interface LostFoundItem {
  id: string;
  title: string;
  type: ItemType;
  category: string;
  location: string;
  date: string;
  description: string;
  imageUrl?: string;
  contactInfo?: string;
  isSensitive: boolean;
  status: ItemStatus;
  userId?: string;
  user?: {
    id: string;
    name: string;
  };
  createdAt: string;
}
