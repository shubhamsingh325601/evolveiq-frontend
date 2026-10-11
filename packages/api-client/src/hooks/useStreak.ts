import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { Streak } from '../types';

/** Consecutive Asia/Kolkata days with at least one finished activity. */
export function useStreak(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progress.streak(studentId ?? ''),
    queryFn: async () =>
      (await request<{ streak: Streak }>('GET', ENDPOINTS.students.streak(studentId!))).streak,
    enabled: Boolean(studentId),
  });
}
