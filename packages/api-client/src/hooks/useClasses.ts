import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { ClassGroup } from '../types';

export type ClassFilters = {
  schoolId?: string;
  teacherId?: string;
};

export function useClasses(filters: ClassFilters = {}) {
  return useQuery({
    queryKey: queryKeys.classes.list(filters),
    queryFn: () => request<ClassGroup[]>('GET', ENDPOINTS.classes.list, { query: filters }),
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (group: Partial<ClassGroup>) =>
      request<ClassGroup>('POST', ENDPOINTS.classes.create, { body: group }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, changes }: { classId: string; changes: Partial<ClassGroup> }) =>
      request<ClassGroup>('PATCH', ENDPOINTS.classes.detail(classId), { body: changes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (classId: string) => request<void>('DELETE', ENDPOINTS.classes.detail(classId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
    },
  });
}
