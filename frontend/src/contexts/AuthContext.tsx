import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, LoginCredentials, SignupCredentials } from '../types/auth.types';
import { authService } from '../services/auth.service';
import { getApiErrorMessage } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const initAuth = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tokenFromUrl = params.get('token');
      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
      }
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      const res = await authService.login(credentials);
      setUser(res.user);
      toast.success(`Welcome back, ${res.user.name}!`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      setLoading(true);
      const res = await authService.signup(credentials);
      setUser(res.user);
      toast.success(`Welcome to Campus Connect, ${res.user.name}!`);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Registration failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const googleLogin = useCallback(async () => {
    authService.googleLogin();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      toast.success('You have logged out');
    } catch {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const updated = await authService.getCurrentUser();
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
