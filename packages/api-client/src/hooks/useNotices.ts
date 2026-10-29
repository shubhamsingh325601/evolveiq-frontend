import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type NoticeFilters } from '../query-keys';
import type { NewNotice, Notice, NoticeChanges } from '../types';

export type { NoticeFilters };

/** The notice board as the signed-in person may read it: pinned first, then newest. */
export function useNotices(filters: NoticeFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.notices.list(filters),
    queryFn: ({ signal }) => fetchAllPages<Notice>(ENDPOINTS.notices.list, 'notices', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** School admins (their school) and platform admins (a school, or every school). */
export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notice: NewNotice) =>
      (await request<{ notice: Notice }>('POST', ENDPOINTS.notices.list, { body: notice })).notice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ noticeId, changes }: { noticeId: string; changes: NoticeChanges }) =>
      (await request<{ notice: Notice }>('PATCH', ENDPOINTS.notices.detail(noticeId), { body: changes })).notice,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noticeId: string) => request('DELETE', ENDPOINTS.notices.detail(noticeId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notices.all });
    },
  });
}
