import type { ReviewQueueFilters } from './types';

/**
 * Query-key factory. Every hook takes its key from here so that invalidation
 * after a mutation stays predictable across all three apps.
 */
export const queryKeys = {
  session: ['session'] as const,
  students: {
    all: ['students'] as const,
    list: (filters: Record<string, unknown> = {}) => ['students', 'list', filters] as const,
    detail: (studentId: string) => ['students', 'detail', studentId] as const,
    growthAreas: (studentId: string) => ['students', studentId, 'growth-areas'] as const,
    teacherNotes: (studentId: string) => ['students', studentId, 'teacher-notes'] as const,
    monthlySummary: (studentId: string) => ['students', studentId, 'monthly-summary'] as const,
    streak: (studentId: string) => ['students', studentId, 'streak'] as const,
    level: (studentId: string) => ['students', studentId, 'level'] as const,
    holisticIndex: (studentId: string) => ['students', studentId, 'holistic-index'] as const,
  },
  observations: {
    all: ['observations'] as const,
    list: (filters: ReviewQueueFilters = {}) => ['observations', 'list', filters] as const,
    detail: (observationId: string) => ['observations', 'detail', observationId] as const,
  },
  activities: {
    all: ['activities'] as const,
    list: (filters: Record<string, unknown> = {}) => ['activities', 'list', filters] as const,
    detail: (activityId: string) => ['activities', 'detail', activityId] as const,
  },
  assignments: {
    all: ['assignments'] as const,
    list: (filters: Record<string, unknown> = {}) => ['assignments', 'list', filters] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: (filters: Record<string, unknown> = {}) => ['classes', 'list', filters] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: Record<string, unknown> = {}) => ['users', 'list', filters] as const,
    detail: (userId: string) => ['users', 'detail', userId] as const,
  },
  schools: {
    all: ['schools'] as const,
    list: () => ['schools', 'list'] as const,
    detail: (schoolId: string) => ['schools', 'detail', schoolId] as const,
  },
} as const;
