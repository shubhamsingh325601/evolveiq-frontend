import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { queryKeys } from '../query-keys';
import type { DevelopmentArea, Observation, ReviewQueueFilters } from '../types';

export type NewObservation = Pick<
  Observation,
  'studentId' | 'area' | 'body' | 'context' | 'frequency' | 'observedAt'
> &
  Partial<Pick<Observation, 'level' | 'learningBehaviourArea' | 'isSignificant'>>;

export interface ReviewDecision {
  observationId: string;
  status: 'reviewed' | 'no-action-needed';
  taggedAreas?: DevelopmentArea[];
  teacherOnlyNote?: string;
}

export function useObservations(filters: ReviewQueueFilters = {}) {
  return useQuery({
    queryKey: queryKeys.observations.list(filters),
    queryFn: () =>
      request<Observation[]>('GET', ENDPOINTS.observations.list, { query: filters }),
  });
}

export function useObservation(observationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.observations.detail(observationId ?? ''),
    queryFn: () =>
      request<Observation>('GET', ENDPOINTS.observations.detail(observationId!)),
    enabled: Boolean(observationId),
  });
}

export function useCreateObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (observation: NewObservation) =>
      request<Observation>('POST', ENDPOINTS.observations.create, { body: observation }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
    },
  });
}

export function useReviewObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ observationId, ...decision }: ReviewDecision) =>
      request<Observation>('POST', ENDPOINTS.observations.review(observationId), {
        body: decision,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
    },
  });
}
