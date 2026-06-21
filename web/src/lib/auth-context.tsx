import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { getToken, setToken, clearToken } from './storage';
import { me } from '../services/auth';
import { User } from '../types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  setSession: (token: string, user: User) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const current = await me();
        if (mounted) {
          setUser(current);
        }
      } catch {
        if (mounted) {
          clearToken();
          setTokenState(null);
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void hydrate();
    return () => {
      mounted = false;
    };
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      setSession: (nextToken, nextUser) => {
        setToken(nextToken);
        setTokenState(nextToken);
        setUser(nextUser);
      },
      refreshUser: async () => {
        const current = await me();
        setUser(current);
      },
      logout: () => {
        clearToken();
        setTokenState(null);
        setUser(null);
      },
    }),
    [loading, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
