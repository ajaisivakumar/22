import api from './api';
import { Poll } from '../types/poll.types';

// ─────────────────────────────────────────────────────────────────────────────
// Poll Service — NO mock fallbacks. Returns empty array when backend is down.
// Polls are ADMIN-ONLY to create. Students can only view and vote.
// ─────────────────────────────────────────────────────────────────────────────

export const pollService = {
  async getActivePolls(): Promise<Poll[]> {
    try {
      const res = await api.get<{ polls: Poll[] }>('/polls?status=ACTIVE');
      return res.data.polls ?? [];
    } catch {
      return [];
    }
  },

  async getAllPolls(): Promise<Poll[]> {
    try {
      const res = await api.get<{ polls: Poll[] }>('/polls');
      return res.data.polls ?? [];
    } catch {
      return [];
    }
  },

  async getPollById(pollId: string): Promise<Poll> {
    const res = await api.get<{ poll: Poll }>(`/polls/${pollId}`);
    return res.data.poll;
  },

  async vote(pollId: string, optionId: string): Promise<Poll> {
    const res = await api.post<{ poll: Poll }>(`/polls/${pollId}/vote`, { optionId });
    return res.data.poll;
  },

  // Admin only — 403 returned by backend for non-admin users
  async createPoll(data: {
    question: string;
    description?: string;
    options: string[];
    expiresAt: string;
  }): Promise<Poll> {
    const res = await api.post<{ poll: Poll }>('/polls', data);
    return res.data.poll;
  },

  async closePoll(pollId: string): Promise<void> {
    await api.patch(`/polls/${pollId}/close`);
  },

  async deletePoll(pollId: string): Promise<void> {
    await api.delete(`/polls/${pollId}`);
  },
};
