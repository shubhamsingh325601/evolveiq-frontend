import preset from '@evolveiq/config/tailwind-preset';

/**
 * Apps extend `content` only. Every token lives in the shared preset so the
 * three apps cannot drift apart (see NAMING_CONVENTIONS.md).
 */
/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/domain/src/**/*.{ts,tsx}',
    '../../packages/auth/src/**/*.{ts,tsx}',
  ],
};
