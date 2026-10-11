import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ENDPOINTS } from './endpoints';
import { ApiError, request, setSessionBridge } from './http-client';
import { DEMO_PASSWORD, resetMockStore } from './mock/mock-transport';
import { signInRequest } from './session';

/**
 * The client's own behaviour, run over the mock transport (VITE_API_BASE_URL
 * is unset in tests): errors carry the backend's code, and an expired access
 * token is renewed once — for everyone waiting — before the request is retried.
 */

async function validToken(): Promise<string> {
  return (await signInRequest({ email: 'tunde@evolveiq.test', password: DEMO_PASSWORD })).accessToken;
}

describe('http client', () => {
  beforeEach(() => resetMockStore());

  afterEach(() => {
    setSessionBridge({ accessToken: () => null, refresh: async () => null });
  });

  it('turns an error response into an ApiError with the backend’s code and field issues', async () => {
    const token = await validToken();
    setSessionBridge({ accessToken: () => token, refresh: async () => null });

    const error = await request('POST', ENDPOINTS.schools.list, { body: { name: '' } }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 400, code: 'VALIDATION_ERROR' });
    expect((error as ApiError).fieldIssues).toEqual([{ field: 'name', message: 'is required' }]);
  });

  it('renews an expired access token once and sends the request again', async () => {
    const fresh = await validToken();
    const refresh = vi.fn(async () => fresh);
    let token = 'expired-token';
    setSessionBridge({ accessToken: () => token, refresh: async () => (token = await refresh()) });

    const response = await request<{ schools: unknown[] }>('GET', ENDPOINTS.schools.list);

    expect(response.schools).toHaveLength(2);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('shares one renewal between every request that failed at the same time', async () => {
    const fresh = await validToken();
    const refresh = vi.fn(async () => fresh);
    let token = 'expired-token';
    setSessionBridge({ accessToken: () => token, refresh: async () => (token = await refresh()) });

    await Promise.all([
      request('GET', ENDPOINTS.schools.list),
      request('GET', ENDPOINTS.users.list),
      request('GET', ENDPOINTS.schools.detail('sch-ridgeview')),
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('lets the 401 stand when the session cannot be renewed', async () => {
    const refresh = vi.fn(async () => null);
    setSessionBridge({ accessToken: () => 'expired-token', refresh });

    const error = await request('GET', ENDPOINTS.schools.list).catch((e: unknown) => e);

    expect(error).toMatchObject({ status: 401, code: 'UNAUTHENTICATED' });
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it('never tries to renew for a sign-in, which is sent without a token', async () => {
    const refresh = vi.fn(async () => 'should-not-be-used');
    setSessionBridge({ accessToken: () => 'some-token', refresh });

    const error = await signInRequest({ email: 'tunde@evolveiq.test', password: 'wrong-password' }).catch(
      (e: unknown) => e,
    );

    expect(error).toMatchObject({ status: 401, code: 'INVALID_CREDENTIALS' });
    expect(refresh).not.toHaveBeenCalled();
  });
});
