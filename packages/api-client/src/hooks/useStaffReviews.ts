import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type StaffReviewFilters } from '../query-keys';
import type { StaffReview, StaffReviewInput } from '../types';

export type { StaffReviewFilters };

/** School admins: every review in their school. Teachers: their own. Newest month first. */
export function useStaffReviews(filters: StaffReviewFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.staffReviews.list(filters),
    queryFn: ({ signal }) => fetchAllPages<StaffReview>(ENDPOINTS.staffReviews.list, 'reviews', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** School admins only. Writing a month again replaces its review. */
export function useSaveStaffReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ staffId, month, review }: { staffId: string; month: string; review: StaffReviewInput }) =>
      (await request<{ review: StaffReview }>('PUT', ENDPOINTS.staffReviews.detail(staffId, month), { body: review })).review,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffReviews.all });
    },
  });
}

export function useDeleteStaffReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ staffId, month }: { staffId: string; month: string }) =>
      request('DELETE', ENDPOINTS.staffReviews.detail(staffId, month)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.staffReviews.all });
    },
  });
}
