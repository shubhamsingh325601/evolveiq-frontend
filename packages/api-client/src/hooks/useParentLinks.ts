import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type ParentLinkFilters } from '../query-keys';
import type { ParentStudentLink, Person } from '../types';

export type { ParentLinkFilters };

/**
 * Parent ↔ student links. Platform admins see every link, school admins the
 * links in their school, parents their own children only.
 */
export function useParentLinks(filters: ParentLinkFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.parentLinks.list(filters),
    queryFn: ({ signal }) =>
      fetchAllPages<ParentStudentLink>(ENDPOINTS.parentStudents.list, 'links', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** The signed-in parent's children, by name. */
export function useChildren(options: { isEnabled?: boolean } = {}) {
  const links = useParentLinks({}, options);
  const children: Person[] = (links.data ?? [])
    .map((link) => link.student)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
  return { ...links, data: links.data ? children : undefined };
}

/** Admins only. A student has at most one parent (409 if they already have one). */
export function useLinkParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (link: { parentId: string; studentId: string }) =>
      (await request<{ link: ParentStudentLink }>('POST', ENDPOINTS.parentStudents.list, { body: link })).link,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.parentLinks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}

export function useUnlinkParent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => request<void>('DELETE', ENDPOINTS.parentStudents.detail(studentId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.parentLinks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
  });
}
