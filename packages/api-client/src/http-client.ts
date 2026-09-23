import { handleMockRequest } from './mock/mock-transport';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** True while no backend URL is configured — every call is served from fixtures. */
export const isUsingMockBackend = API_BASE_URL === '';

type TokenProvider = () => string | null;

let readAuthToken: TokenProvider = () => null;

/**
 * `packages/auth` installs the session-token reader here. Keeping it as a
 * callback avoids an import cycle between auth and api-client.
 */
export function setAuthTokenProvider(provider: TokenProvider): void {
  readAuthToken = provider;
}

function buildQueryString(query: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
}

/**
 * The only place in the codebase that calls `fetch`. Every screen reaches the
 * backend through a TanStack Query hook that funnels into this function.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (isUsingMockBackend) {
    return handleMockRequest<T>(method, path, options);
  }

  const token = readAuthToken();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(options.query)}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ApiError(response.status, detail || `${method} ${path} failed`);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
