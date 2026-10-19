import api from './api';
import { User, LoginCredentials, SignupCredentials } from '../types/auth.types';

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

const BACKEND_ORIGIN =
  (import.meta.env.VITE_BACKEND_ORIGIN as string | undefined) || 'http://localhost:5000';

export const authService = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await api.get<{ user: User }>('/auth/me');
      return response.data.user ?? null;
    } catch {
      return null;
    }
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  async signup(data: SignupCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  googleLogin(): void {
    window.location.href = `${BACKEND_ORIGIN}/api/auth/google`;
  },

  async getGoogleStatus(): Promise<boolean> {
    try {
      const res = await api.get<{ configured: boolean }>('/auth/google/status');
      return !!res.data.configured;
    } catch {
      return false;
    }
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>('/auth/verify-email', {
      token,
    });
    return response.data;
  },

  async resendVerification(email: string): Promise<{ success: boolean }> {
    const res = await api.post<{ success: boolean }>('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/auth/reset-password', { token, password });
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
    }
  },

  async updateProfile(data: { name: string; avatarUrl?: string }): Promise<User> {
    const response = await api.patch<{ user: User }>('/auth/profile', data);
    return response.data.user;
  },

  async changePassword(passwords: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/auth/change-password', passwords);
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/auth/profile');
    localStorage.removeItem('token');
  },
};
