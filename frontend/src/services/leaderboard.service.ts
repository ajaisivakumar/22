import api from './api';
import { LeaderboardEntry, MyLeaderboardStatus } from '../types/leaderboard.types';

export const leaderboardService = {
  async getLeaderboard(milestone?: string): Promise<LeaderboardEntry[]> {
    try {
      const query = milestone && milestone !== 'ALL' ? `?milestone=${encodeURIComponent(milestone)}` : '';
      const res = await api.get<{ entries?: LeaderboardEntry[]; leaderboard?: LeaderboardEntry[] }>(
        `/leaderboard${query}`
      );
      return res.data.entries ?? res.data.leaderboard ?? [];
    } catch {
      return [];
    }
  },

  async getMyEntry(): Promise<LeaderboardEntry | null> {
    try {
      const res = await api.get<{ entry: LeaderboardEntry | null }>('/leaderboard/me');
      return res.data.entry ?? null;
    } catch {
      return null;
    }
  },

  async getMyStatus(): Promise<MyLeaderboardStatus | null> {
    try {
      const res = await api.get<{ status: MyLeaderboardStatus }>('/leaderboard/me');
      return res.data.status ?? null;
    } catch {
      return {
        isOptedIn: false,
        isAnonymous: false,
      };
    }
  },

  async updateOptIn(isOptedIn: boolean, isAnonymous: boolean): Promise<MyLeaderboardStatus> {
    const res = await api.post<{ status: MyLeaderboardStatus }>('/leaderboard/opt-in', {
      isOptedIn,
      isAnonymous,
    });
    return res.data.status;
  },

  async publishEntry(data: {
    academicBatch: string;
    semesterMilestone: number;
    displayMode: 'ANONYMOUS' | 'NAMED';
    consentGiven: boolean;
  }): Promise<LeaderboardEntry> {
    const res = await api.post<{ entry: LeaderboardEntry }>('/leaderboard/publish', data);
    return res.data.entry;
  },

  async updateEntry(data: { displayMode?: string; consentGiven?: boolean }): Promise<LeaderboardEntry> {
    const res = await api.patch<{ entry: LeaderboardEntry }>('/leaderboard/publish', data);
    return res.data.entry;
  },

  async withdrawEntry(): Promise<void> {
    await api.delete('/leaderboard/publish');
  },

  async verifyEntry(id: string, verified = true): Promise<LeaderboardEntry> {
    const res = await api.patch<{ entry: LeaderboardEntry }>(`/admin/leaderboard/${id}/verify`, {
      verified,
    });
    return res.data.entry;
  },

  async getAllEntries(params?: { milestone?: string }): Promise<LeaderboardEntry[]> {
    return leaderboardService.getLeaderboard(params?.milestone);
  },
};
