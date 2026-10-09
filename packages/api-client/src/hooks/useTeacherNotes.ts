import { useQueries, useQuery } from '@tanstack/react-query';
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

/** Teacher notes for several children at once, newest first. Shares each child's cache entry. */
export function useTeacherNotesForStudents(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: queryKeys.students.teacherNotes(studentId),
      queryFn: () => request<TeacherNote[]>('GET', ENDPOINTS.students.teacherNotes(studentId)),
    })),
    combine: (results) =>
      results
        .flatMap((result) => result.data ?? [])
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  });
}
