import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys } from '../query-keys';
import type { School } from '../types';

/** Platform admins and psychologists (who filter the review queue by school). */
export function useSchools(options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.schools.list(),
    queryFn: ({ signal }) =>
      fetchAllPages<School>(ENDPOINTS.schools.list, 'schools', { sortBy: 'name' }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** Anyone can open their own school; platform admins and psychologists any school. */
export function useSchool(schoolId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.schools.detail(schoolId ?? ''),
    queryFn: async () =>
      (await request<{ school: School }>('GET', ENDPOINTS.schools.detail(schoolId!))).school,
    enabled: Boolean(schoolId),
  });
}

/** Platform admins only. */
export function useCreateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (school: { name: string }) =>
      (await request<{ school: School }>('POST', ENDPOINTS.schools.list, { body: school })).school,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

/** Platform admins only. */
export function useRenameSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ schoolId, name }: { schoolId: string; name: string }) =>
      (await request<{ school: School }>('PATCH', ENDPOINTS.schools.detail(schoolId), { body: { name } }))
        .school,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}

/** Platform admins only, and only an empty school (else 409 `HAS_RECORDS`). */
export function useDeleteSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schoolId: string) => request('DELETE', ENDPOINTS.schools.detail(schoolId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.schools.all });
    },
  });
}
