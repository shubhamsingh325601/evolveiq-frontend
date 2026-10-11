import { describe, expect, it, vi } from 'vitest';
import { ApiError, type TokenPair } from '@evolveiq/api-client';
import { createSessionStore, SESSION_STORAGE_KEY, type StoredSession } from './session-store';

/** A localStorage stand-in that two "tabs" can share. */
function sharedStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
    stored: () => {
      const raw = data.get(SESSION_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredSession) : null;
    },
  };
}

const USER = { id: 'usr-priya', role: 'parent' as const, fullName: 'Priya Ahluwalia', schoolId: 'sch-1' };
const SESSION: StoredSession = { accessToken: 'access-1', refreshToken: 'refresh-1', user: USER };

const pair = (n: number): TokenPair => ({
  accessToken: `access-${n}`,
  tokenType: 'Bearer',
  expiresIn: 3600,
  refreshToken: `refresh-${n}`,
  refreshExpiresIn: 604800,
});

/** Runs tasks one after another, like the Web Locks API does across tabs. */
function serialLock() {
  let chain: Promise<unknown> = Promise.resolve();
  return <T>(task: () => Promise<T>): Promise<T> => {
    const run = chain.then(task, task);
    chain = run.catch(() => undefined);
    return run;
  };
}

describe('session store', () => {
  it('renews with the refresh token and keeps the rotated pair', async () => {
    const storage = sharedStorage();
    const refresh = vi.fn(async () => pair(2));
    const store = createSessionStore({ storage, refresh });
    store.start(SESSION);

    expect(await store.renew()).toBe('access-2');
    expect(refresh).toHaveBeenCalledWith('refresh-1');
    expect(storage.stored()).toMatchObject({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    expect(store.accessToken()).toBe('access-2');
  });

  it('takes the tokens another tab already renewed instead of spending its own stale one', async () => {
    const storage = sharedStorage();
    const refresh = vi.fn(async () => pair(3));
    const thisTab = createSessionStore({ storage, refresh });
    thisTab.start(SESSION);
    // The other tab rotated refresh-1 into refresh-2 and saved it.
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...SESSION, accessToken: 'access-2', refreshToken: 'refresh-2' }));

    expect(await thisTab.renew()).toBe('access-2');
    expect(refresh).not.toHaveBeenCalled();
  });

  it('lets two tabs that expire together renew once between them', async () => {
    const storage = sharedStorage();
    const lock = serialLock();
    let rotations = 0;
    const refresh = vi.fn(async (token: string) => {
      // A spent token is treated as stolen: using it twice ends the session.
      if (token !== `refresh-${rotations + 1}`) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'reused');
      rotations += 1;
      return pair(rotations + 1);
    });
    const tabA = createSessionStore({ storage, refresh, lock });
    const tabB = createSessionStore({ storage, refresh, lock });
    tabA.start(SESSION);
    tabB.restore();

    const [a, b] = await Promise.all([tabA.renew(), tabB.renew()]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(a).toBe('access-2');
    expect(b).toBe('access-2');
    expect(storage.stored()?.refreshToken).toBe('refresh-2');
  });

  it('ends the session when the server refuses the renewal', async () => {
    const storage = sharedStorage();
    const ended = vi.fn();
    const store = createSessionStore({
      storage,
      refresh: async () => {
        throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.');
      },
    });
    store.onEnded(ended);
    store.start(SESSION);

    expect(await store.renew()).toBeNull();
    expect(ended).toHaveBeenCalledTimes(1);
    expect(storage.stored()).toBeNull();
    expect(store.current()).toBeNull();
  });

  it('keeps the session when the network fails, and says so', async () => {
    const storage = sharedStorage();
    const ended = vi.fn();
    const store = createSessionStore({
      storage,
      refresh: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    store.onEnded(ended);
    store.start(SESSION);

    await expect(store.renew()).rejects.toThrow('Failed to fetch');
    expect(ended).not.toHaveBeenCalled();
    expect(store.current()).toEqual(SESSION);
  });

  it('follows another tab: renewed tokens are adopted, a sign-out signs this tab out', () => {
    const storage = sharedStorage();
    const ended = vi.fn();
    const store = createSessionStore({ storage, refresh: async () => pair(9) });
    store.onEnded(ended);
    store.start(SESSION);

    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ ...SESSION, accessToken: 'access-5', refreshToken: 'refresh-5' }));
    expect(store.syncFromStorage()).toBe('renewed');
    expect(store.accessToken()).toBe('access-5');

    storage.removeItem(SESSION_STORAGE_KEY);
    expect(store.syncFromStorage()).toBe('ended');
    expect(ended).toHaveBeenCalledTimes(1);
    expect(store.current()).toBeNull();
  });

  it('ignores a session saved by an older build, which cannot be renewed', () => {
    const storage = sharedStorage();
    storage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ token: 'old', user: USER }));
    const store = createSessionStore({ storage, refresh: async () => pair(2) });

    expect(store.restore()).toBeNull();
  });
});
