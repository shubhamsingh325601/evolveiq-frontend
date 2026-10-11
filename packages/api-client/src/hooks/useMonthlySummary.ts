import { useQuery } from '@tanstack/react-query';
import { businessMonth } from '../business-time';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { MonthlySummary } from '../types';

/**
 * The plain-language summary of one month ("YYYY-MM", Asia/Kolkata), this
 * month by default. The current month is built live; a finished month is
 * stored the first time anyone asks and never changes afterwards.
 */
export function useMonthlySummary(studentId: string | undefined, month: string = businessMonth()) {
  return useQuery({
    queryKey: queryKeys.progress.monthlySummary(studentId ?? '', month),
    queryFn: async () =>
      (
        await request<{ summary: MonthlySummary }>(
          'GET',
          ENDPOINTS.students.monthlySummary(studentId!, month),
        )
      ).summary,
    enabled: Boolean(studentId),
  });
}
