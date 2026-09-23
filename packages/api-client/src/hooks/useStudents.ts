import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { Student } from '../types';

export type StudentFilters = {
  classId?: string;
  schoolId?: string;
  parentId?: string;
  search?: string;
};

export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: () => request<Student[]>('GET', ENDPOINTS.students.list, { query: filters }),
  });
}

export function useStudent(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.students.detail(studentId ?? ''),
    queryFn: () => request<Student>('GET', ENDPOINTS.students.detail(studentId!)),
    enabled: Boolean(studentId),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (student: Partial<Student>) =>
      request<Student>('POST', ENDPOINTS.students.list, { body: student }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, changes }: { studentId: string; changes: Partial<Student> }) =>
      request<Student>('PATCH', ENDPOINTS.students.detail(studentId), { body: changes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) =>
      request<void>('DELETE', ENDPOINTS.students.detail(studentId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}
