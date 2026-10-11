import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages, fetchTotal } from '../list';
import { queryKeys, type UserFilters } from '../query-keys';
import type { NewUser, User, UserChanges } from '../types';

export type { UserFilters };

/**
 * Accounts the caller manages: platform admins every user; school admins the
 * students, teachers and parents of their own school.
 */
export function useUsers(filters: UserFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: ({ signal }) => fetchAllPages<User>(ENDPOINTS.users.list, 'users', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** How many accounts match each set of filters — counts for KPI tiles, without the rows. */
export function useUserCounts<TKey extends string>(
  filtersByKey: Record<TKey, UserFilters>,
  options: { isEnabled?: boolean } = {},
) {
  const keys = Object.keys(filtersByKey) as TKey[];
  return useQueries({
    queries: keys.map((key) => ({
      queryKey: queryKeys.users.count(filtersByKey[key]),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchTotal(ENDPOINTS.users.list, { ...(filtersByKey[key] as UserFilters) }, signal),
      enabled: options.isEnabled ?? true,
    })),
    combine: (results) =>
      Object.fromEntries(keys.map((key, index) => [key, results[index]?.data])) as Record<
        TKey,
        number | undefined
      >,
  });
}

function invalidatePeople(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.parentLinks.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.classes.all });
}

/**
 * Creates an account through the admin-only registration endpoint. Students
 * get a student ID and a six-digit PIN; adults an email and a password.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (user: NewUser) =>
      (await request<{ user: { id: string } }>('POST', ENDPOINTS.auth.register, { body: user })).user,
    onSuccess: () => invalidatePeople(queryClient),
  });
}

/** Names and sign-in identifiers only; role and school never change. */
export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, changes }: { userId: string; changes: UserChanges }) =>
      (await request<{ user: User }>('PATCH', ENDPOINTS.users.detail(userId), { body: changes })).user,
    onSuccess: () => invalidatePeople(queryClient),
  });
}

/** Accounts are deactivated, never deleted. Nobody can deactivate themselves. */
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      (await request<{ user: User }>('POST', ENDPOINTS.users.deactivate(userId))).user,
    onSuccess: () => invalidatePeople(queryClient),
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) =>
      (await request<{ user: User }>('POST', ENDPOINTS.users.reactivate(userId))).user,
    onSuccess: () => invalidatePeople(queryClient),
  });
}
