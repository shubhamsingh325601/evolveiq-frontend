import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { ActivityResponse, Assignment, AssignmentStatus } from '../types';

export type AssignmentFilters = {
  studentId?: string;
  status?: AssignmentStatus;
  dueOn?: string;
};

/** Everything currently set for a student, newest due date first. */
export function useActivityQueue(filters: AssignmentFilters = {}) {
  return useQuery({
    queryKey: queryKeys.assignments.list(filters),
    queryFn: () => request<Assignment[]>('GET', ENDPOINTS.assignments.list, { query: filters }),
  });
}

export function useAssignActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignment: { activityId: string; studentId: string; dueOn?: string }) =>
      request<Assignment>('POST', ENDPOINTS.assignments.create, { body: assignment }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}

export function useCompleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      responses,
    }: {
      assignmentId: string;
      responses: ActivityResponse[];
    }) =>
      request<Assignment>('POST', ENDPOINTS.assignments.complete(assignmentId), {
        body: { responses },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.all });
    },
  });
}
