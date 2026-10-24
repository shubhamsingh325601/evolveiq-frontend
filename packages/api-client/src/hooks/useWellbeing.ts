import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { Consent, ConsentPurpose, NewWellnessCheckin, WellnessCheckin, WellnessCheckins } from '../types';

/** Where the family stands on each purpose. A student reads it; a parent reads and changes it. */
export function useConsents(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.consents.student(studentId ?? ''),
    queryFn: async ({ signal }) =>
      (await request<{ consents: Consent[] }>('GET', ENDPOINTS.students.consents(studentId!), { signal })).consents,
    enabled: Boolean(studentId),
  });
}

/** Parents only: allow or withdraw one purpose for their own child. */
export function useSetConsent(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ purpose, granted }: { purpose: ConsentPurpose; granted: boolean }) =>
      (
        await request<{ consent: Consent }>('PUT', ENDPOINTS.students.consent(studentId, purpose), {
          body: { granted },
        })
      ).consent,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.consents.student(studentId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wellness.all });
    },
  });
}

/** The last `days` days of check-ins. Staff get an empty, marked answer unless the family shares. */
export function useWellnessCheckins(studentId: string | undefined, days = 30) {
  return useQuery({
    queryKey: queryKeys.wellness.student(studentId ?? '', days),
    queryFn: ({ signal }) =>
      request<WellnessCheckins>('GET', ENDPOINTS.students.wellnessCheckins(studentId!), { query: { days }, signal }),
    enabled: Boolean(studentId),
  });
}

/** A student or their parent records a day. 403 CONSENT_REQUIRED until tracking is allowed. */
export function useRecordCheckin(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (checkin: NewWellnessCheckin) =>
      (
        await request<{ checkin: WellnessCheckin }>('POST', ENDPOINTS.students.wellnessCheckins(studentId), {
          body: checkin,
        })
      ).checkin,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wellness.all });
    },
  });
}
