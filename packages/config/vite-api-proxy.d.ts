import type { ProxyOptions } from 'vite';

/** Forwards `/api` to the backend (`VITE_API_PROXY_TARGET`, default http://localhost:3000). */
export function apiProxy(env: Record<string, string>): Record<string, ProxyOptions>;
