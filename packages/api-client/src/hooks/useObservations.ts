import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages, fetchTotal } from '../list';
import { queryKeys } from '../query-keys';
import { toParentObservation } from '../redaction';
import type {
  NewObservation,
  ObservationDetail,
  ParentObservation,
  ReviewDecision,
  ReviewObservation,
  ReviewQueueFilters,
  TeacherObservation,
} from '../types';

// ───────────────────────────── Psychologist ─────────────────────────────

/** The review queue, newest first, across every school unless filtered. */
export function useReviewQueue(filters: ReviewQueueFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.observations.queue(filters),
    queryFn: ({ signal }) =>
      fetchAllPages<ReviewObservation>(
        ENDPOINTS.observations.list,
        'observations',
        { ...filters, sortOrder: 'desc' },
        signal,
      ),
    enabled: options.isEnabled ?? true,
  });
}

/**
 * How many observations each filter holds, from the list metadata alone —
 * the KPI tiles over the queue.
 */
export function useReviewQueueCounts<TKey extends string>(
  filtersByKey: Record<TKey, ReviewQueueFilters>,
  options: { isEnabled?: boolean } = {},
) {
  const keys = Object.keys(filtersByKey) as TKey[];
  return useQueries({
    queries: keys.map((key) => ({
      queryKey: queryKeys.observations.queueCount(filtersByKey[key]),
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchTotal(ENDPOINTS.observations.list, { ...(filtersByKey[key] as ReviewQueueFilters) }, signal),
      enabled: options.isEnabled ?? true,
    })),
    combine: (results) =>
      Object.fromEntries(keys.map((key, index) => [key, results[index]?.data])) as Record<
        TKey,
        number | undefined
      >,
  });
}

/** One observation with the student's other observations for context. */
export function useObservationDetail(observationId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.observations.detail(observationId ?? ''),
    queryFn: () => request<ObservationDetail>('GET', ENDPOINTS.observations.detail(observationId!)),
    enabled: Boolean(observationId),
  });
}

/**
 * Closes an observation in one transaction: "Assign & mark reviewed" also
 * creates the recommended assignments. A review can't be repeated (409).
 */
export function useReviewObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ observationId, decision }: { observationId: string; decision: ReviewDecision }) =>
      (
        await request<{ observation: ReviewObservation }>(
          'POST',
          ENDPOINTS.observations.review(observationId),
          { body: decision },
        )
      ).observation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.assignments.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.activities.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },
  });
}

// ───────────────────────────── Teacher ─────────────────────────────

/** Only the observations this teacher wrote, with status and the psychologist's note back. */
export function useTeacherObservations(options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.observations.teacher(),
    queryFn: ({ signal }) =>
      fetchAllPages<TeacherObservation>(ENDPOINTS.observations.mine, 'observations', {}, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** About a student of one of the teacher's classes. A positive one is a star for them at once. */
export function useCreateTeacherObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (observation: NewObservation) =>
      (
        await request<{ observation: TeacherObservation }>('POST', ENDPOINTS.observations.list, {
          body: observation,
        })
      ).observation,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },
  });
}

// ───────────────────────────── Parent ─────────────────────────────

/** Only the observations this parent wrote, with their status. Nothing clinical. */
export function useFamilyObservations(options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.observations.family(),
    queryFn: async ({ signal }) =>
      (
        await fetchAllPages<ParentObservation>(ENDPOINTS.family.observations, 'observations', {}, signal)
      ).map(toParentObservation),
    enabled: options.isEnabled ?? true,
  });
}

/** About one of the parent's own children. Level and learning-behaviour area are never sent. */
export function useCreateFamilyObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ level: _level, learningBehaviourArea: _area, ...observation }: NewObservation) =>
      toParentObservation(
        (
          await request<{ observation: ParentObservation }>('POST', ENDPOINTS.family.observations, {
            body: observation,
          })
        ).observation,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.observations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.progress.all });
    },
  });
}
