import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { NewSupportPlan, SupportPlan, SupportPlanChanges } from '../types';

/** Staff only (teachers of the student's class, psychologists). Open plans first. */
export function useSupportPlans(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.supportPlans.student(studentId ?? ''),
    queryFn: async ({ signal }) =>
      (await request<{ plans: SupportPlan[] }>('GET', ENDPOINTS.students.supportPlans(studentId!), { signal })).plans,
    enabled: Boolean(studentId),
  });
}

export function useCreateSupportPlan(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (plan: NewSupportPlan) =>
      (await request<{ plan: SupportPlan }>('POST', ENDPOINTS.students.supportPlans(studentId), { body: plan })).plan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportPlans.student(studentId) });
    },
  });
}

export function useUpdateSupportPlan(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ planId, changes }: { planId: string; changes: SupportPlanChanges }) =>
      (await request<{ plan: SupportPlan }>('PATCH', ENDPOINTS.supportPlans.detail(planId), { body: changes })).plan,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportPlans.student(studentId) });
    },
  });
}
