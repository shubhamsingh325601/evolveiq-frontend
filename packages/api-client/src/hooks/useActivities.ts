import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type ActivityFilters } from '../query-keys';
import type { Activity, ActivityChanges, NewActivity } from '../types';

export type { ActivityFilters };

/**
 * The one global library. Teachers see active activities only; psychologists
 * can also list the archived ones.
 */
export function useActivities(filters: ActivityFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.activities.list(filters),
    queryFn: ({ signal }) =>
      fetchAllPages<Activity>(ENDPOINTS.activities.list, 'activities', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

export function useActivity(activityId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities.detail(activityId ?? ''),
    queryFn: async () =>
      (await request<{ activity: Activity }>('GET', ENDPOINTS.activities.detail(activityId!))).activity,
    enabled: Boolean(activityId),
  });
}

/** Psychologists only. */
export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activity: NewActivity) =>
      (await request<{ activity: Activity }>('POST', ENDPOINTS.activities.list, { body: activity }))
        .activity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

/** Psychologists only. Once assigned, the type and options are frozen (409). */
export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ activityId, changes }: { activityId: string; changes: ActivityChanges }) =>
      (
        await request<{ activity: Activity }>('PATCH', ENDPOINTS.activities.detail(activityId), {
          body: changes,
        })
      ).activity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

/** Activities are never deleted; an archived one can no longer be assigned. */
export function useArchiveActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (activityId: string) =>
      (await request<{ activity: Activity }>('POST', ENDPOINTS.activities.archive(activityId))).activity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}
