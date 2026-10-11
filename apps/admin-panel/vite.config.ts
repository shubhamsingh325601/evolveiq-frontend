import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { apiProxy } from '@evolveiq/config/vite-api-proxy';

export default defineConfig(({ mode }) => {
  // One .env at the repo root configures all three apps.
  const env = loadEnv(mode, '../../', '');
  return {
    plugins: [react()],
    envDir: '../../',
    server: { port: 5175, proxy: apiProxy(env) },
    preview: { port: 5175, proxy: apiProxy(env) },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: false,
    },
  };
});
