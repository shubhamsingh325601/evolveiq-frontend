import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type HonourFilters } from '../query-keys';
import type { Honour, NewHonour } from '../types';

export type { HonourFilters };

/**
 * The celebration wall, newest month first. Staff see their school's; a family
 * sees the Staff of the Month and only their own child's honours.
 */
export function useHonours(filters: HonourFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.honours.list(filters),
    queryFn: ({ signal }) => fetchAllPages<Honour>(ENDPOINTS.honours.list, 'honours', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** School admins only. */
export function useCreateHonour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (honour: NewHonour) =>
      (await request<{ honour: Honour }>('POST', ENDPOINTS.honours.list, { body: honour })).honour,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.honours.all });
    },
  });
}

export function useDeleteHonour() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (honourId: string) => request('DELETE', ENDPOINTS.honours.detail(honourId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.honours.all });
    },
  });
}
