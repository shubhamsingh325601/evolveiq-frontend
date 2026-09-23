import { useQuery } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { TeacherNote } from '../types';

/** Read-only for parents. Psychologist notes are a separate, never-parent-facing field. */
export function useTeacherNotes(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.teacherNotes(studentId ?? ''),
    queryFn: () => request<TeacherNote[]>('GET', ENDPOINTS.students.teacherNotes(studentId!)),
    enabled: Boolean(studentId),
  });
}
