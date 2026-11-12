import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { MessageInbox, MessageThread, SchoolContact, ThreadMessage } from '../types';

/** Parents: the school people they may write to about one child. */
export function useSchoolContacts(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.contacts(studentId ?? ''),
    queryFn: async ({ signal }) =>
      (await request<{ contacts: SchoolContact[] }>('GET', ENDPOINTS.students.contacts(studentId!), { signal })).contacts,
    enabled: Boolean(studentId),
  });
}

/** Parents: the thread about one child with one contact. Opening it marks the replies as read. */
export function useFamilyThread(studentId: string | undefined, contactId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.family(studentId ?? '', contactId ?? ''),
    queryFn: ({ signal }) =>
      request<MessageThread>('GET', ENDPOINTS.students.messages(studentId!), { query: { contactId: contactId! }, signal }),
    enabled: Boolean(studentId && contactId),
  });
}

/** Parents: write to a contact. Starts the thread, or adds to it. */
export function useSendFamilyMessage(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ contactId, body }: { contactId: string; body: string }) =>
      (await request<{ message: ThreadMessage }>('POST', ENDPOINTS.students.messages(studentId), { body: { contactId, body } }))
        .message,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}

/** Staff: one row per child who has written, with unread counts. */
export function useMessageInbox() {
  return useQuery({
    queryKey: queryKeys.messages.inbox,
    queryFn: ({ signal }) => request<MessageInbox>('GET', ENDPOINTS.messages.inbox, { signal }),
  });
}

/** Staff: the thread with one child's parent. 404 when the parent has not written. */
export function useStaffThread(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.messages.staff(studentId ?? ''),
    queryFn: ({ signal }) => request<MessageThread>('GET', ENDPOINTS.messages.thread(studentId!), { signal }),
    enabled: Boolean(studentId),
  });
}

/** Staff: reply in a thread the parent started. */
export function useReplyToParent(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: string) =>
      (await request<{ message: ThreadMessage }>('POST', ENDPOINTS.messages.thread(studentId), { body: { body } })).message,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages.all });
    },
  });
}
