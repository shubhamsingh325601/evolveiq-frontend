import { useQueries, useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { fetchAllPages } from '../list';
import { queryKeys } from '../query-keys';
import { toStar } from '../redaction';
import type { Star } from '../types';

/**
 * A student's stars, newest first: one for every positive observation a
 * teacher or their parent wrote. Students, parents and staff all get the same
 * parent-safe shape, and it is copied field by field on the way in.
 */
export function useStars(studentId: string | undefined, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.progress.stars(studentId ?? ''),
    queryFn: ({ signal }) => fetchStars(studentId!, signal),
    enabled: Boolean(studentId) && (options.isEnabled ?? true),
  });
}

async function fetchStars(studentId: string, signal?: AbortSignal): Promise<Star[]> {
  return (await fetchAllPages<Star>(ENDPOINTS.students.stars(studentId), 'stars', {}, signal)).map(toStar);
}

/** Stars for a set of students — a roster or a parent's children — by student. */
export function useStarsForStudents(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: queryKeys.progress.stars(studentId),
      queryFn: ({ signal }: { signal: AbortSignal }) => fetchStars(studentId, signal),
    })),
    combine: (results) =>
      new Map(studentIds.map((studentId, index) => [studentId, results[index]?.data] as const)),
  });
}
