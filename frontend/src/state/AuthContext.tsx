import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearToken, getToken, setToken } from '../api/client';
import type { PlayerDTO } from '../api/types';

interface AuthValue {
  player: PlayerDTO | null;
  loading: boolean;
  refresh: () => Promise<void>;
  claim: (body: { username: string; password: string; email?: string }) => Promise<void>;
  login: (body: { username: string; password: string }) => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerDTO | null>(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      if (getToken()) {
        const { player } = await api.me();
        setPlayer(player);
      } else {
        const { token, player } = await api.bootstrapGuest();
        setToken(token);
        setPlayer(player);
      }
    } catch {
      clearToken();
      try {
        const { token, player } = await api.bootstrapGuest();
        setToken(token);
        setPlayer(player);
      } catch {
        setPlayer(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const refresh = useCallback(async () => {
    const { player } = await api.me();
    setPlayer(player);
  }, []);

  const claim = useCallback(async (body: { username: string; password: string; email?: string }) => {
    const { token, player } = await api.claim(body);
    setToken(token);
    setPlayer(player);
  }, []);

  const login = useCallback(async (body: { username: string; password: string }) => {
    const { token, player } = await api.login(body);
    setToken(token);
    setPlayer(player);
  }, []);

  return <AuthContext.Provider value={{ player, loading, refresh, claim, login }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
