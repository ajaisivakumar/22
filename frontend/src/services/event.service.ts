import api from './api';
import { CampusEvent } from '../types/event.types';

export const eventService = {
  async getEvents(params?: { category?: string; status?: string }): Promise<CampusEvent[]> {
    try {
      const query = new URLSearchParams();
      if (params?.category && params.category !== 'ALL') query.set('category', params.category);
      if (params?.status) query.set('status', params.status);
      const suffix = query.toString() ? `?${query}` : '';
      const res = await api.get<{ events: CampusEvent[] }>(`/events${suffix}`);
      return res.data.events ?? [];
    } catch {
      return [];
    }
  },

  async getEventById(id: string): Promise<CampusEvent> {
    const res = await api.get<{ event: CampusEvent }>(`/events/${id}`);
    return res.data.event;
  },

  async submitEvent(data: Partial<CampusEvent>): Promise<CampusEvent> {
    const res = await api.post<{ event: CampusEvent }>('/events', data);
    return res.data.event;
  },

  // Alias: EventsPage uses createEvent
  async createEvent(data: Partial<CampusEvent>): Promise<CampusEvent> {
    return this.submitEvent(data);
  },

  async updateEvent(id: string, data: Partial<CampusEvent>): Promise<CampusEvent> {
    const res = await api.patch<{ event: CampusEvent }>(`/events/${id}`, data);
    return res.data.event;
  },

  // AdminEventsPage uses updateEventStatus
  async updateEventStatus(id: string, status: string, note?: string): Promise<CampusEvent> {
    const res = await api.patch<{ event: CampusEvent }>(`/events/${id}`, {
      status,
      moderatorNotes: note,
    });
    return res.data.event;
  },

  async deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
  },

  async getMySubmissions(): Promise<CampusEvent[]> {
    try {
      const res = await api.get<{ events: CampusEvent[] }>('/events/my');
      return res.data.events ?? [];
    } catch {
      return [];
    }
  },

  async reportEvent(id: string, reason: string): Promise<void> {
    await api.post(`/events/${id}/report`, { reason });
  },

  // Admin
  async adminGetAllEvents(): Promise<CampusEvent[]> {
    try {
      const res = await api.get<{ events: CampusEvent[] }>('/admin/events');
      return res.data.events ?? [];
    } catch {
      return [];
    }
  },

  async adminApproveEvent(id: string): Promise<void> {
    await api.post(`/admin/events/${id}/approve`);
  },

  async adminRejectEvent(id: string, reason: string): Promise<void> {
    await api.post(`/admin/events/${id}/reject`, { reason });
  },
};
