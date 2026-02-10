'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { dashboardApi } from '../api';

interface User {
  id: string;
  email: string;
  name?: string;
  tier: string;
  webhookSecret?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextValue {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = dashboardApi.getToken();
    if (token) {
      dashboardApi
        .getMe()
        .then((data) => setUser(data.user))
        .catch(() => dashboardApi.setToken(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await dashboardApi.login(email, password);
    dashboardApi.setToken(data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const data = await dashboardApi.signup(email, password, name);
    dashboardApi.setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    dashboardApi.setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const data = await dashboardApi.getMe();
    setUser(data.user);
  }, []);

  return { user, loading, login, signup, logout, refreshUser };
}
