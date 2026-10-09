import { useQueries, useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { HolisticIndex } from '../types';

/** A child's EvolvIQ Holistic Index, or `null` before the first one is worked out. */
export function useHolisticIndex(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.holisticIndex(studentId ?? ''),
    queryFn: () =>
      request<HolisticIndex | null>('GET', ENDPOINTS.students.holisticIndex(studentId!)),
    enabled: Boolean(studentId),
  });
}

/**
 * The index for a whole roster, keyed by student. Each child keeps its own
 * cache entry, so opening one child afterwards needs no new request.
 */
export function useHolisticIndexes(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: queryKeys.students.holisticIndex(studentId),
      queryFn: () =>
        request<HolisticIndex | null>('GET', ENDPOINTS.students.holisticIndex(studentId)),
    })),
    combine: (results) => ({
      byStudentId: new Map(
        results.flatMap((result) => (result.data ? [[result.data.studentId, result.data] as const] : [])),
      ),
      isLoading: results.some((result) => result.isLoading),
    }),
  });
}
