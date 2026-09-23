import { QueryClient } from '@tanstack/react-query';

/**
 * One client configuration for all three apps. Retries are off for 4xx because
 * the mock backend (and the real one) answer permission problems with a 4xx
 * that will never succeed on a second attempt.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          const status = (error as { status?: number }).status;
          if (status !== undefined && status < 500) return false;
          return failureCount < 2;
        },
      },
    },
  });
}
