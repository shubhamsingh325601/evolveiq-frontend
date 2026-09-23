import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { School } from '../types';

export function useSchools() {
  return useQuery({
    queryKey: queryKeys.schools.list(),
    queryFn: () => request<School[]>('GET', ENDPOINTS.schools.list),
  });
}

export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (school: Partial<School>) =>
      request<School>('POST', ENDPOINTS.schools.create, { body: school }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, changes }: { schoolId: string; changes: Partial<School> }) =>
      request<School>('PATCH', ENDPOINTS.schools.detail(schoolId), { body: changes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}
