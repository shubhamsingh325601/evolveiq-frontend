import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { StudentLevel } from '../types';

/**
 * Level and XP. Finishing an assignment invalidates every student query, so
 * this refreshes on its own after `useCompleteAssignment`.
 */
export function useStudentLevel(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.level(studentId ?? ''),
    queryFn: () => request<StudentLevel>('GET', ENDPOINTS.students.level(studentId!)),
    enabled: Boolean(studentId),
  });
}
