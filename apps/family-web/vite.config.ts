import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { apiProxy } from '@evolveiq/config/vite-api-proxy';

// The colour behind the app while it opens, and the browser bar: the page background.
const CANVAS = '#F4F3FA';

export default defineConfig(({ mode }) => {
  // One .env at the repo root configures all three apps.
  const env = loadEnv(mode, '../../', '');
  return {
    plugins: [
      react(),
      // Parents and students can install the app on their phone (client request, 20 Nov 2026).
      // Only the app itself is stored on the device. The API is another origin and is never
      // cached, so a child's data does not stay on a shared phone.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: 'EvolvIQ Family',
          short_name: 'EvolvIQ',
          description: 'Stars, activities and progress from school, for parents and their children.',
          lang: 'en-IN',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          background_color: CANVAS,
          theme_color: CANVAS,
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: '/index.html',
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // The two typefaces, so the installed app looks right on a poor connection.
              urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
    envDir: '../../',
    server: { port: 5173, proxy: apiProxy(env) },
    preview: { port: 5173, proxy: apiProxy(env) },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      css: false,
    },
  };
});
