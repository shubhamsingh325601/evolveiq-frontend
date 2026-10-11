import { isUsingMockBackend } from '@evolveiq/api-client';

/**
 * Whether the sign-in screens offer the one-tap demo accounts. They always
 * work with the in-memory mock, and against a development backend filled by
 * `npm run db:seed-demo` once `VITE_SHOW_DEMO_ACCOUNTS=true` — never in a real
 * deployment by default.
 */
export const showsDemoAccounts: boolean =
  isUsingMockBackend || import.meta.env?.VITE_SHOW_DEMO_ACCOUNTS === 'true';
