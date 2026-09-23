import preset from '@evolveiq/config/tailwind-preset';

/** Scans the three apps too, since this shell renders their screens. */
/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../../apps/*/src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/domain/src/**/*.{ts,tsx}',
    '../../packages/auth/src/**/*.{ts,tsx}',
  ],
};
