import { useQueryClient, type QueryClient } from '@tanstack/react-query';

// One stable function per client, so callers can list it as a dependency.
const clearers = new WeakMap<QueryClient, () => void>();

/**
 * Forgets every response cached so far. `packages/auth` calls it on sign-in
 * and sign-out, so nothing one person loaded — a teacher's unredacted
 * observations, say — can be served to whoever signs in next on the same
 * device while the cache still counts it as fresh.
 */
export function useClearCachedData(): () => void {
  const queryClient = useQueryClient();
  let clear = clearers.get(queryClient);
  if (!clear) {
    clear = () => queryClient.clear();
    clearers.set(queryClient, clear);
  }
  return clear;
}
