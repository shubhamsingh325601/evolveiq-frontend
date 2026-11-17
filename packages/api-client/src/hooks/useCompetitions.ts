import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';
import { fetchAllPages } from '../list';
import { queryKeys, type CompetitionFilters } from '../query-keys';
import type { Competition, CompetitionChanges, CompetitionNomination, NewCompetition } from '../types';

export type { CompetitionFilters };

/**
 * Events & Competitions — a gap found against the client's UI prototype (16
 * Nov 2026), not yet a confirmed client request; built so the project is
 * ready to demo. A competition belongs to exactly one school, unlike
 * Notices: Teachers, Psychologists and School Admins see their own school's
 * only (a Psychologist has no school of their own, so that view is always
 * empty); Platform Admins see every school's, filterable by `schoolId`.
 * Each competition carries its own nominations.
 */
export function useCompetitions(filters: CompetitionFilters = {}, options: { isEnabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.competitions.list(filters),
    queryFn: ({ signal }) => fetchAllPages<Competition>(ENDPOINTS.competitions.list, 'competitions', { ...filters }, signal),
    enabled: options.isEnabled ?? true,
  });
}

/** School Admins their own school; Platform Admins must name a real, existing school. */
export function useCreateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (competition: NewCompetition) =>
      (await request<{ competition: Competition }>('POST', ENDPOINTS.competitions.list, { body: competition })).competition,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

/** The competition a caller may manage only: their own school's (School Admin) or any (Platform Admin). */
export function useUpdateCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, changes }: { competitionId: string; changes: CompetitionChanges }) =>
      (await request<{ competition: Competition }>('PATCH', ENDPOINTS.competitions.detail(competitionId), { body: changes }))
        .competition,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

export function useDeleteCompetition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (competitionId: string) => request('DELETE', ENDPOINTS.competitions.detail(competitionId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

/** Teachers: nominate one of their own students. 422 if the student is not theirs, 409 if already nominated. */
export function useNominateStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ competitionId, studentId }: { competitionId: string; studentId: string }) =>
      (
        await request<{ nomination: CompetitionNomination }>('POST', ENDPOINTS.competitions.nominations(competitionId), {
          body: { studentId },
        })
      ).nomination,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}

/** The nominating teacher, or School Admin (own school) / Platform Admin. */
export function useRemoveNomination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ competitionId, studentId }: { competitionId: string; studentId: string }) =>
      request('DELETE', ENDPOINTS.competitions.nomination(competitionId, studentId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.competitions.all });
    },
  });
}
