import { isApiError, type SessionUser, type TokenPair } from '@evolveiq/api-client';

export const SESSION_STORAGE_KEY = 'evolveiq.session';

export interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

type SessionStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SessionStoreDeps {
  /** Where the session survives a reload. Null when the browser blocks storage. */
  storage: SessionStorage | null;
  /** Swaps a refresh token for a new pair (POST /auth/refresh). */
  refresh: (refreshToken: string) => Promise<TokenPair>;
  /**
   * Runs one renewal at a time across every tab of the app (the Web Locks API
   * in the browser). Refresh tokens rotate and a spent one is treated as
   * stolen, so two tabs renewing with the same token would end the session.
   */
  lock?: <T>(task: () => Promise<T>) => Promise<T>;
}

/**
 * The signed-in session, outside React, so the http client can read and renew
 * it between renders. It is kept in step with other tabs through storage: a
 * tab that renewed the session leaves the new tokens there, and the next tab
 * to need a renewal takes those instead of spending its own stale token.
 */
export function createSessionStore({ storage, refresh, lock = (task) => task() }: SessionStoreDeps) {
  let current: StoredSession | null = null;
  let onEnded: () => void = () => {};

  function read(): StoredSession | null {
    try {
      const raw = storage?.getItem(SESSION_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<StoredSession>) : null;
      // A session saved by an older build (one token, no refresh token) is not resumable.
      return parsed?.accessToken && parsed.refreshToken && parsed.user ? (parsed as StoredSession) : null;
    } catch {
      return null;
    }
  }

  function write(session: StoredSession | null): void {
    try {
      if (session) storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      else storage?.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // A blocked storage API must not stop someone using the app in this tab.
    }
  }

  function end(): void {
    current = null;
    write(null);
    onEnded();
  }

  return {
    current: () => current,
    accessToken: () => current?.accessToken ?? null,

    /** On load: picks up the session this browser already has, if any. */
    restore(): StoredSession | null {
      current = read();
      return current;
    },

    start(session: StoredSession): void {
      current = session;
      write(session);
    },

    clear(): void {
      current = null;
      write(null);
    },

    /** Called when the server ends the session, so the UI can sign out too. */
    onEnded(listener: () => void): void {
      onEnded = listener;
    },

    /**
     * A new access token, or null once the session is over. Network failures
     * are rethrown: being offline is not a reason to sign someone out.
     */
    renew(): Promise<string | null> {
      const session = current;
      if (!session) return Promise.resolve(null);
      return lock(async () => {
        // While this tab waited, another tab (or an earlier renewal here) may
        // already have rotated the token: use that rather than spending ours.
        const stored = read();
        if (stored && stored.user.id === session.user.id && stored.refreshToken !== session.refreshToken) {
          current = stored;
          return stored.accessToken;
        }
        if (current !== session) return current?.accessToken ?? null;
        try {
          const tokens = await refresh(session.refreshToken);
          current = { ...session, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
          write(current);
          return current.accessToken;
        } catch (error) {
          if (isApiError(error) && (error.status === 401 || error.status === 403)) {
            if (current === session) end();
            return null;
          }
          throw error;
        }
      });
    },

    /**
     * Another tab changed the stored session. Renewed tokens are adopted; a
     * sign-out there (or a different person signing in) signs this tab out.
     * Returns what this tab should now show.
     */
    syncFromStorage(): 'kept' | 'renewed' | 'ended' {
      const stored = read();
      if (!current) {
        // Signed out here: a sign-in in another tab is left for this tab's own sign-in screen.
        return 'kept';
      }
      if (!stored || stored.user.id !== current.user.id) {
        current = null;
        onEnded();
        return 'ended';
      }
      if (stored.refreshToken !== current.refreshToken) {
        current = stored;
        return 'renewed';
      }
      return 'kept';
    },
  };
}

export type SessionStore = ReturnType<typeof createSessionStore>;
