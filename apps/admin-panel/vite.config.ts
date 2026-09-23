import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // One .env at the repo root configures all three apps.
  envDir: '../../',
  server: { port: 5175 },
  preview: { port: 5175 },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    css: false,
  },
});
