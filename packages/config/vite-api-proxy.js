/**
 * The dev server's proxy to the backend, shared by the three apps and the dev
 * shell. With `VITE_API_BASE_URL=/api/v1` the browser calls the app's own
 * origin and Vite forwards `/api` to the backend, so local development needs
 * no CORS on the API. `VITE_API_PROXY_TARGET` moves it off the default port.
 *
 * @param {Record<string, string>} env the variables Vite loaded from the root .env
 * @returns {Record<string, import('vite').ProxyOptions>}
 */
export function apiProxy(env) {
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:3000';
  return { '/api': { target, changeOrigin: true } };
}
