import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { Activity, ActivityStep, DevelopmentArea } from '../types';

export type ActivityFilters = {
  area?: DevelopmentArea;
  search?: string;
};

export type NewActivity = Pick<
  Activity,
  'title' | 'description' | 'area' | 'ageRange' | 'estimatedMinutes'
> & { steps: ActivityStep[] };

export function useActivities(filters: ActivityFilters = {}) {
  return useQuery({
    queryKey: queryKeys.activities.list(filters),
    queryFn: () => request<Activity[]>('GET', ENDPOINTS.activities.list, { query: filters }),
  });
}

export function useActivity(activityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities.detail(activityId ?? ''),
    queryFn: () => request<Activity>('GET', ENDPOINTS.activities.detail(activityId!)),
    enabled: Boolean(activityId),
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activity: NewActivity) =>
      request<Activity>('POST', ENDPOINTS.activities.create, { body: activity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}
