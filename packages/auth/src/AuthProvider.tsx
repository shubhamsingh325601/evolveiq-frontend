import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  refreshRequest,
  setSessionBridge,
  signInRequest,
  signOutRequest,
  useClearCachedData,
  type Credentials,
  type SessionUser,
} from '@evolveiq/api-client';
import { AuthContext, type AuthState } from './auth-context';
import { createSessionStore, SESSION_STORAGE_KEY } from './session-store';

function browserStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** One renewal at a time across every tab, where the browser supports the Web Locks API. */
async function acrossTabs<T>(task: () => Promise<T>): Promise<T> {
  const locks = typeof navigator === 'undefined' ? undefined : navigator.locks;
  if (!locks) return task();
  // The lock is held until the task settles, and its promise settles with the task's result.
  return await locks.request('evolveiq.session.refresh', task);
}

const store = createSessionStore({ storage: browserStorage(), refresh: refreshRequest, lock: acrossTabs });

setSessionBridge({ accessToken: store.accessToken, refresh: store.renew });

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  // Cached responses belong to whoever loaded them. Without this, someone
  // signing in straight after someone else could be shown the first person's
  // data — including clinical detail a parent must never see.
  const clearCachedData = useClearCachedData();

  useEffect(() => {
    const stored = store.restore();
    if (stored) setUser(stored.user);
    setIsRestoring(false);
  }, []);

  useEffect(() => {
    // The server ended the session (a renewal was refused), or another tab signed out.
    store.onEnded(() => {
      clearCachedData();
      setUser(null);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === SESSION_STORAGE_KEY) store.syncFromStorage();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      store.onEnded(() => {});
      window.removeEventListener('storage', onStorage);
    };
  }, [clearCachedData]);

  const signIn = useCallback(
    async (credentials: Credentials) => {
      const result = await signInRequest(credentials);
      clearCachedData();
      store.start({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
      setUser(result.user);
      return result.user;
    },
    [clearCachedData],
  );

  const signOut = useCallback(() => {
    const ending = store.current();
    // Tell the server so this session's refresh token stops working, without
    // making the person wait for the answer. The request reads the access
    // token before the session is cleared below.
    if (ending) void signOutRequest(ending.refreshToken).catch(() => undefined);
    clearCachedData();
    store.clear();
    setUser(null);
  }, [clearCachedData]);

  const value = useMemo<AuthState>(
    () => ({ user, role: user?.role, isRestoring, signIn, signOut }),
    [user, isRestoring, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
