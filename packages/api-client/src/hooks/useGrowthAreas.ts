import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { GrowthArea } from '../types';

/** The PRD caps a student at five growth areas; the backend enforces it. */
export function useGrowthAreas(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.growthAreas(studentId ?? ''),
    queryFn: () => request<GrowthArea[]>('GET', ENDPOINTS.students.growthAreas(studentId!)),
    enabled: Boolean(studentId),
  });
}
