import api from './api';
import { LostFoundItem } from '../types/lostfound.types';

export const lostFoundService = {
  async getItems(params?: { category?: string; type?: string; status?: string }): Promise<LostFoundItem[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.type) query.set('type', params.type);
      if (params?.status) query.set('status', params.status);
      const res = await api.get<{ items: LostFoundItem[] }>(`/lost-and-found?${query}`);
      return res.data.items ?? [];
    } catch {
      return [];
    }
  },

  async getItemById(id: string): Promise<LostFoundItem> {
    const res = await api.get<{ item: LostFoundItem }>(`/lost-and-found/${id}`);
    return res.data.item;
  },

  // createItem: posts a JSON body (used from LostFoundPage form)
  async createItem(data: Partial<LostFoundItem>): Promise<LostFoundItem> {
    const res = await api.post<{ item: LostFoundItem }>('/lost-and-found', data);
    return res.data.item;
  },

  // submitItem: sends multipart FormData (used when uploading an image file)
  async submitItem(formData: FormData): Promise<LostFoundItem> {
    const res = await api.post<{ item: LostFoundItem }>('/lost-and-found', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.item;
  },

  async updateItemStatus(id: string, status: string): Promise<LostFoundItem> {
    const res = await api.patch<{ item: LostFoundItem }>(`/lost-and-found/${id}`, { status });
    return res.data.item;
  },

  async deleteItem(id: string): Promise<void> {
    await api.delete(`/lost-and-found/${id}`);
  },

  async reportItem(id: string, reason: string): Promise<void> {
    await api.post(`/lost-and-found/${id}/report`, { reason });
  },

  // Admin
  async adminGetAllItems(): Promise<LostFoundItem[]> {
    try {
      const res = await api.get<{ items: LostFoundItem[] }>('/admin/lost-and-found');
      return res.data.items ?? [];
    } catch {
      return [];
    }
  },

  async adminHideItem(id: string): Promise<void> {
    await api.patch(`/admin/lost-and-found/${id}/hide`);
  },
};
