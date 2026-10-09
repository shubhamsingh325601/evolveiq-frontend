import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ENDPOINTS,
  request,
  setAuthTokenProvider,
  setMockCurrentUser,
  useClearCachedData,
  type User,
} from '@evolveiq/api-client';
import { AuthContext, type AuthState } from './auth-context';

const SESSION_STORAGE_KEY = 'evolveiq.session';

interface StoredSession {
  token: string;
  user: User;
}

function readStoredSession(): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredSession | null): void {
  try {
    if (session) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  } catch {
    // A blocked storage API must not stop someone signing in for this session.
  }
}

let activeToken: string | null = null;
setAuthTokenProvider(() => activeToken);

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  // Cached responses belong to whoever loaded them. Without this, someone
  // signing in straight after someone else could be shown the first person's
  // data — including clinical detail a parent must never see.
  const clearCachedData = useClearCachedData();

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      activeToken = stored.token;
      setMockCurrentUser(stored.user.id);
      setUser(stored.user);
    }
    setIsRestoring(false);
  }, []);

  const signIn = useCallback(async (email: string) => {
    const session = await request<StoredSession>('POST', ENDPOINTS.session.login, {
      body: { email },
    });
    clearCachedData();
    activeToken = session.token;
    writeStoredSession(session);
    setUser(session.user);
    return session.user;
  }, [clearCachedData]);

  const signOut = useCallback(() => {
    clearCachedData();
    activeToken = null;
    writeStoredSession(null);
    setMockCurrentUser(null);
    setUser(null);
  }, [clearCachedData]);

  const value = useMemo<AuthState>(
    () => ({ user, role: user?.role, isRestoring, signIn, signOut }),
    [user, isRestoring, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
