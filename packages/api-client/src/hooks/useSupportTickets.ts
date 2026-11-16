import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type SupportTicketFilters } from '../query-keys';
import type { NewSupportTicket, SupportTicket, SupportTicketStatus } from '../types';

export type { SupportTicketFilters };

/**
 * The IT Help Desk, as the signed-in person may read it: School Admins see
 * their whole school's tickets, Teachers only the ones they raised,
 * Platform Admins every school's (optionally filtered by `schoolId`).
 * Newest first.
 */
export function useSupportTickets(filters: SupportTicketFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.supportTickets.list(filters),
    queryFn: ({ signal }) => fetchAllPages<SupportTicket>(ENDPOINTS.supportTickets.list, 'tickets', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** Teachers and School Admins, always for their own school; status starts `open`. */
export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ticket: NewSupportTicket) =>
      (await request<{ ticket: SupportTicket }>('POST', ENDPOINTS.supportTickets.list, { body: ticket })).ticket,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets.all });
    },
  });
}

/** School Admins (their own school) and Platform Admins (any). */
export function useUpdateSupportTicketStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: SupportTicketStatus }) =>
      (await request<{ ticket: SupportTicket }>('PATCH', ENDPOINTS.supportTickets.detail(ticketId), { body: { status } })).ticket,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.supportTickets.all });
    },
  });
}
