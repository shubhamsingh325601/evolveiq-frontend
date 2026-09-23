import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { StreakInfo } from '../types';

export function useStreak(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.streak(studentId ?? ''),
    queryFn: () => request<StreakInfo>('GET', ENDPOINTS.students.streak(studentId!)),
    enabled: Boolean(studentId),
  });
}
