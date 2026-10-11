import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys } from '../query-keys';
import { toFamilyAssignment } from '../redaction';
import type {
  ActivityAnswer,
  CompletionRecord,
  FamilyAssignment,
  StaffAssignment,
  StudentAssignment,
} from '../types';

/** The signed-in student's own assignments, newest first, with their own answers. */
export function useMyAssignments(options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.assignments.mine(),
    queryFn: ({ signal }) =>
      fetchAllPages<StudentAssignment>(ENDPOINTS.assignments.mine, 'assignments', {}, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** Teachers (students of their classes) and psychologists: a student's assignments, with answers. */
export function useStudentAssignments(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assignments.student(studentId ?? ''),
    queryFn: ({ signal }) =>
      fetchAllPages<StaffAssignment>(ENDPOINTS.students.assignments(studentId!), 'assignments', {}, signal),
    enabled: Boolean(studentId),
  });
}

/** A parent's child: each activity and whether it is done. Never the child's answers. */
export function useChildAssignments(studentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.assignments.child(studentId ?? ''),
    queryFn: async ({ signal }) =>
      (
        await fetchAllPages<FamilyAssignment>(
          ENDPOINTS.family.childAssignments(studentId!),
          'assignments',
          {},
          signal,
        )
      ).map(toFamilyAssignment),
    enabled: Boolean(studentId),
  });
}

/** Several children's activities at once (a parent's rail and bell). Shares each child's cache entry. */
export function useChildrenAssignments(studentIds: string[]) {
  return useQueries({
    queries: studentIds.map((studentId) => ({
      queryKey: queryKeys.assignments.child(studentId),
      queryFn: async ({ signal }: { signal: AbortSignal }) =>
        (
          await fetchAllPages<FamilyAssignment>(
            ENDPOINTS.family.childAssignments(studentId),
            'assignments',
            {},
            signal,
          )
        ).map(toFamilyAssignment),
    })),
    combine: (results) =>
      new Map(studentIds.map((studentId, index) => [studentId, results[index]?.data ?? []] as const)),
  });
}

/** A teacher's direct assignment to a student of one of their classes. */
export function useAssignActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: { studentId: string; activityId: string }) =>
      (
        await request<{ assignment: StaffAssignment }>('POST', ENDPOINTS.assignments.create, {
          body: assignment,
        })
      ).assignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      // The activity is now "assigned", which freezes its type and options.
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
    },
  });
}

/** A student answers one of their own assignments, once. */
export function useCompleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (completion: { assignmentId: string; answer: ActivityAnswer }) =>
      (
        await request<{ completion: CompletionRecord }>('POST', ENDPOINTS.activityCompletions.create, {
          body: completion,
        })
      ).completion,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },
  });
}
