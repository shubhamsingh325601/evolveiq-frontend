import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { Notifications } from '../types';

/** How often an open app asks again. Notifications are derived, so this is cheap. */
const REFRESH_MS = 60_000;

/** The signed-in user's feed and unread count. */
export function useNotifications(options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.all,
    queryFn: ({ signal }) => request<Notifications>('GET', ENDPOINTS.notifications.list, { signal }),
    enabled: options.isEnabled ?? true,
    refetchInterval: REFRESH_MS,
  });
}

/** Marks everything read. */
export function useMarkNotificationsSeen() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request<{ seenAt: string }>('POST', ENDPOINTS.notifications.seen, { body: {} }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
