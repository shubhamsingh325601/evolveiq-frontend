import { handleMockRequest } from './mock/mock-transport';
import type { ApiErrorBody, FieldIssue } from './types';

export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  signal?: AbortSignal;
  /**
   * Sent without the session's access token, and a 401 never triggers a token
   * refresh. Sign-in and the refresh call itself use this.
   */
  isAnonymous?: boolean;
}

/** Every failed request, with the backend's stable error code. */
export class ApiError extends Error {
  readonly status: number;
  /** e.g. `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `DUPLICATE_ACCOUNT`, `CONFLICT`. */
  readonly code: string;
  readonly details: ApiErrorBody['error']['details'];

  constructor(status: number, code: string, message: string, details?: ApiErrorBody['error']['details']) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Per-field problems from a 400; empty otherwise. */
  get fieldIssues(): FieldIssue[] {
    return Array.isArray(this.details) ? this.details : [];
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

/** True while no backend URL is configured — every call is served by the in-memory mock. */
export const isUsingMockBackend = API_BASE_URL === '';

/**
 * How the http client reaches the signed-in session. `packages/auth` installs
 * it; keeping it a callback pair avoids an import cycle between the packages.
 */
export interface SessionBridge {
  /** The current access token, or null when nobody is signed in. */
  accessToken(): string | null;
  /**
   * Swaps the refresh token for a new access token. Resolves to it, or to
   * null once the session cannot be renewed (which signs the person out).
   */
  refresh(): Promise<string | null>;
}

let session: SessionBridge = { accessToken: () => null, refresh: async () => null };

export function setSessionBridge(bridge: SessionBridge): void {
  session = bridge;
}

// Many requests can fail with an expired token at once; they share one refresh.
let refreshInFlight: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  refreshInFlight ??= session.refresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
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

/** What a transport — `fetch` or the mock — answers. */
export interface TransportResponse {
  status: number;
  body: unknown;
}

async function send(
  method: HttpMethod,
  path: string,
  options: RequestOptions,
  token: string | null,
): Promise<TransportResponse> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  if (isUsingMockBackend) {
    return handleMockRequest(method, path, { query: options.query, body: options.body, headers });
  }

  const response = await fetch(`${API_BASE_URL}${path}${buildQueryString(options.query)}`, {
    method,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
  });
  const text = await response.text();
  let body: unknown;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { status: response.status, body };
}

function toApiError(response: TransportResponse, method: HttpMethod, path: string): ApiError {
  const error = (response.body as Partial<ApiErrorBody> | undefined)?.error;
  if (error && typeof error.code === 'string' && typeof error.message === 'string') {
    return new ApiError(response.status, error.code, error.message, error.details);
  }
  return new ApiError(response.status, 'HTTP_ERROR', `${method} ${path} failed with ${response.status}`);
}

/**
 * The only place in the codebase that calls `fetch`. Every screen reaches the
 * backend through a TanStack Query hook that funnels into this function.
 *
 * An access token lasts an hour. When one is rejected, the session's refresh
 * token buys a new one and the request is sent once more; if that is not
 * possible the person is signed out and the original 401 stands.
 */
export async function request<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.isAnonymous ? null : session.accessToken();
  let response = await send(method, path, options, token);

  if (response.status === 401 && token) {
    // Another request may already have renewed the session while this one was out.
    const current = session.accessToken();
    const renewed = current && current !== token ? current : await refreshOnce();
    if (renewed) response = await send(method, path, options, renewed);
  }

  if (response.status >= 400) throw toApiError(response, method, path);
  return response.body as T;
}
