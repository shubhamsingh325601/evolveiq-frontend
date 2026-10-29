import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { HealthProfile, HealthProfileInput } from '../types';

/**
 * Copied field by field, like a star: the same shape reaches the family and the
 * school, so nothing that might arrive beside it is ever kept.
 */
export function toHealthProfile(raw: HealthProfile): HealthProfile {
  return {
    studentId: raw.studentId,
    conditions: [...raw.conditions],
    bloodGroup: raw.bloodGroup,
    allergies: raw.allergies,
    medications: raw.medications,
    careNotes: raw.careNotes,
    emergencyContact: raw.emergencyContact
      ? { name: raw.emergencyContact.name, relation: raw.emergencyContact.relation, phone: raw.emergencyContact.phone }
      : null,
    updatedBy: raw.updatedBy ? { fullName: raw.updatedBy.fullName, role: raw.updatedBy.role } : null,
    updatedAt: raw.updatedAt,
  };
}

/** A child's health and care needs. Parents, their teachers, the counsellor and the school admin. */
export function useHealthProfile(studentId: string | undefined, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.health.student(studentId ?? ''),
    queryFn: async ({ signal }) =>
      toHealthProfile((await request<{ health: HealthProfile }>('GET', ENDPOINTS.students.health(studentId!), { signal })).health),
    enabled: Boolean(studentId) && (options.isEnabled ?? true),
  });
}

/** Parents and school admins. A write replaces the whole profile. */
export function useSaveHealthProfile(studentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: HealthProfileInput) =>
      toHealthProfile((await request<{ health: HealthProfile }>('PUT', ENDPOINTS.students.health(studentId), { body: profile })).health),
    onSuccess: (saved) => {
      queryClient.setQueryData(queryKeys.health.student(studentId), saved);
      void queryClient.invalidateQueries({ queryKey: queryKeys.health.all });
    },
  });
}

/**
 * The recorded profiles of several classes — a teacher's roster or a school's
 * students — by student. A student with nothing recorded is simply absent.
 */
export function useClassesHealth(classIds: string[], options: { isEnabled?: boolean } = {}) {
  return useQueries({
    queries: classIds.map((classId) => ({
      queryKey: queryKeys.health.class(classId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (await request<{ profiles: HealthProfile[] }>('GET', ENDPOINTS.classes.health(classId), { signal })).profiles.map(toHealthProfile),
      enabled: options.isEnabled ?? true,
    })),
    combine: (results) => ({
      byStudentId: new Map(results.flatMap((result) => (result.data ?? []).map((profile) => [profile.studentId, profile] as const))),
      isLoading: results.some((result) => result.isLoading),
    }),
  });
}
