import react from '@vitejs/plugin-react';
import { loadEnv, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { apiProxy } from '@evolveiq/config/vite-api-proxy';

// The colour behind the app while it opens, and the browser bar: the page background.
const CANVAS = '#F4F3FA';

/**
 * How each build introduces itself: the tab title, and the name under the icon
 * once installed. Parents get family.evolviq.in, children student.evolviq.in
 * (VITE_FAMILY_AUDIENCE, see src/family-audience.ts); unset, one app for both.
 * The names "Parent EVQ" and "Student EVQ" are the client's (21 Nov 2026).
 */
const AUDIENCES = {
  both: {
    name: 'EvolvIQ Family',
    shortName: 'EvolvIQ',
    description: 'Stars, activities and progress from school, for parents and their children.',
  },
  parents: {
    name: 'Parent EVQ',
    shortName: 'Parent EVQ',
    description: 'Your child’s stars, activities and progress from school.',
  },
  students: {
    name: 'Student EVQ',
    shortName: 'Student EVQ',
    description: 'Your missions, stars and progress from school.',
  },
} as const;

/** Puts the build's name and description into index.html. */
function audienceHtml(meta: (typeof AUDIENCES)[keyof typeof AUDIENCES]): Plugin {
  return {
    name: 'evolveiq-family-audience-html',
    transformIndexHtml: (html) =>
      html
        .replace(/<title>[^<]*<\/title>/, `<title>${meta.name}</title>`)
        .replace(/(<meta name="description" content=")[^"]*/, `$1${meta.description}`)
        .replace(/(<meta name="apple-mobile-web-app-title" content=")[^"]*/, `$1${meta.shortName}`),
  };
}

export default defineConfig(({ mode }) => {
  // One .env at the repo root configures all three apps.
  const env = loadEnv(mode, '../../', '');
  const audience = env.VITE_FAMILY_AUDIENCE === 'parents' || env.VITE_FAMILY_AUDIENCE === 'students' ? env.VITE_FAMILY_AUDIENCE : 'both';
  const meta = AUDIENCES[audience];
  return {
    plugins: [
      react(),
      audienceHtml(meta),
      // Parents and students can install the app on their phone (client request, 20 Nov 2026).
      // Only the app itself is stored on the device. The API is another origin and is never
      // cached, so a child's data does not stay on a shared phone.
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          id: '/',
          name: meta.name,
          short_name: meta.shortName,
          description: meta.description,
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
