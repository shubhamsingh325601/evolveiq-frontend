import { useQueries, useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { GrowthArea } from '../types';

/** The PRD caps a student at five growth areas. The backend enforces it; the slice is a second guard. */
export const MAX_GROWTH_AREAS = 5;

/**
 * A student's growth areas: the development areas of their most recent
 * "Assign & mark reviewed" reviews, newest first. Names only, parent-safe.
 */
export function useGrowthAreas(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.progress.growthAreas(studentId ?? ''),
    queryFn: () => fetchGrowthAreas(studentId!),
    enabled: Boolean(studentId),
  });
}

async function fetchGrowthAreas(studentId: string): Promise<GrowthArea[]> {
  const response = await request<{ growthAreas: GrowthArea[] }>('GET', ENDPOINTS.students.growthAreas(studentId));
  return response.growthAreas.slice(0, MAX_GROWTH_AREAS);
}

/** A roster's growth areas, by student. Each student keeps their own cache entry. */
export function useGrowthAreasForStudents(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: queryKeys.progress.growthAreas(studentId),
      queryFn: () => fetchGrowthAreas(studentId),
    })),
    combine: (results) =>
      new Map(studentIds.map((studentId, index) => [studentId, results[index]?.data] as const)),
  });
}
