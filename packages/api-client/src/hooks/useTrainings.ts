import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type TrainingFilters } from '../query-keys';
import type { NewTraining, Training, TrainingChanges, TrainingEnrolment } from '../types';

export type { TrainingFilters };

/**
 * The Staff Training & Development Hub, as the signed-in person may read it:
 * Teachers and School Admins see their school's trainings and the ones for
 * every school; Psychologists and Platform Admins every school's (they work
 * across schools, optionally narrowed with `schoolId`). Newest first, each
 * with the caller's own enrolment, if any.
 */
export function useTrainings(filters: TrainingFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.trainings.list(filters),
    queryFn: ({ signal }) => fetchAllPages<Training>(ENDPOINTS.trainings.list, 'trainings', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** School Admins their own school; Platform Admins one school, or every school. */
export function useCreateTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (training: NewTraining) =>
      (await request<{ training: Training }>('POST', ENDPOINTS.trainings.list, { body: training })).training,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
    },
  });
}

/** The training a caller may manage only: their own school's (School Admin) or any (Platform Admin). */
export function useUpdateTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ trainingId, changes }: { trainingId: string; changes: TrainingChanges }) =>
      (await request<{ training: Training }>('PATCH', ENDPOINTS.trainings.detail(trainingId), { body: changes })).training,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
    },
  });
}

export function useDeleteTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trainingId: string) => request('DELETE', ENDPOINTS.trainings.detail(trainingId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
    },
  });
}

/** Teachers and Psychologists: self-enrol in a training they can see. 409 if already enrolled. */
export function useEnrolInTraining() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trainingId: string) =>
      (await request<{ enrolment: TrainingEnrolment }>('POST', ENDPOINTS.trainings.enrolment(trainingId))).enrolment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
    },
  });
}

/** Teachers and Psychologists: mark their own enrolment complete. */
export function useCompleteTrainingEnrolment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (trainingId: string) =>
      (await request<{ enrolment: TrainingEnrolment }>('PATCH', ENDPOINTS.trainings.enrolment(trainingId))).enrolment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.trainings.all });
    },
  });
}
