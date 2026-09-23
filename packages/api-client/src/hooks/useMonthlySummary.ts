import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { MonthlySummary } from '../types';

export function useMonthlySummary(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.monthlySummary(studentId ?? ''),
    queryFn: () =>
      request<MonthlySummary | null>('GET', ENDPOINTS.students.monthlySummary(studentId!)),
    enabled: Boolean(studentId),
  });
}
