import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { Role, User } from '../types';

export type UserFilters = {
  role?: Role;
  schoolId?: string;
  search?: string;
};

export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => request<User[]>('GET', ENDPOINTS.users.list, { query: filters }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (user: Partial<User>) =>
      request<User>('POST', ENDPOINTS.users.create, { body: user }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, changes }: { userId: string; changes: Partial<User> }) =>
      request<User>('PATCH', ENDPOINTS.users.detail(userId), { body: changes }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => request<void>('DELETE', ENDPOINTS.users.detail(userId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
