import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { apiProxy } from '@evolveiq/config/vite-api-proxy';

const appSrc = (app: string) =>
  fileURLToPath(new URL(`../../apps/${app}/src`, import.meta.url));

/**
 * Development launcher. Aliases let this shell import each product app's root
 * component without the apps needing to know it exists — they stay ordinary,
 * independently buildable apps.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../../', '');
  return {
    plugins: [react()],
    envDir: '../../',
    server: { port: 5170, proxy: apiProxy(env) },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: false,
    },
    resolve: {
      alias: {
        '@family-web': appSrc('family-web'),
        '@school-web': appSrc('school-web'),
        '@admin-panel': appSrc('admin-panel'),
      },
    },
  };
});
