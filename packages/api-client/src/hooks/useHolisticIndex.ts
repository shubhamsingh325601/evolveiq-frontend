import { useQueries, useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys } from '../query-keys';
import type { GrowthMoment, HolisticIndex } from '../types';

/** A child's EvolvIQ Holistic Index: the same parent-safe shape for every audience. */
export function useHolisticIndex(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progress.holisticIndex(studentId ?? ''),
    queryFn: async ({ signal }) =>
      (await request<{ holisticIndex: HolisticIndex }>('GET', ENDPOINTS.students.holisticIndex(studentId!), { signal }))
        .holisticIndex,
    enabled: Boolean(studentId),
  });
}

/** A child's good days as a timeline, newest first: stars, finished activities and milestones. */
export function useGrowthMoments(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progress.growthMoments(studentId ?? ''),
    queryFn: ({ signal }) =>
      fetchAllPages<GrowthMoment>(ENDPOINTS.students.growthMoments(studentId!), 'moments', {}, signal),
    enabled: Boolean(studentId),
  });
}

/** Several children's indexes at once — a parent's family — by student id. */
export function useHolisticIndexes(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: queryKeys.progress.holisticIndex(studentId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (await request<{ holisticIndex: HolisticIndex }>('GET', ENDPOINTS.students.holisticIndex(studentId), { signal }))
          .holisticIndex,
    })),
    combine: (results) => ({
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
      byStudent: new Map(studentIds.map((studentId, index) => [studentId, results[index]?.data] as const)),
    }),
  });
}
