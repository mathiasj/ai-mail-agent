'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

interface User {
  id: string;
  email: string;
  name: string | null;
  tier: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api
        .getMe()
        .then(({ user }) => setUser(user))
        .catch(() => {
          api.setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user } = await api.login(email, password);
    api.setToken(token);
    setUser(user);
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const { token, user } = await api.signup(email, password, name);
    api.setToken(token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    api.setToken(null);
    setUser(null);
  }, []);

  return { user, loading, login, signup, logout };
}
