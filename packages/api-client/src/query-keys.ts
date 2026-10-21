import type { ActivityType, ReviewQueueFilters, Role } from './types';

export interface UserFilters {
  role?: Role;
  schoolId?: string;
  isActive?: boolean;
}

export interface ParentLinkFilters {
  parentId?: string;
  studentId?: string;
}

export interface ActivityFilters {
  type?: ActivityType;
  /** Psychologists only: list archived activities instead of active ones. */
  isArchived?: boolean;
}

/**
 * Query-key factory. Every hook takes its key from here so that invalidation
 * after a mutation stays predictable across all three apps.
 */
export const queryKeys = {
  schools: {
    all: ['schools'] as const,
    list: () => ['schools', 'list'] as const,
    detail: (schoolId: string) => ['schools', 'detail', schoolId] as const,
  },
  users: {
    all: ['users'] as const,
    list: (filters: UserFilters = {}) => ['users', 'list', filters] as const,
    count: (filters: UserFilters = {}) => ['users', 'count', filters] as const,
  },
  parentLinks: {
    all: ['parent-links'] as const,
    list: (filters: ParentLinkFilters = {}) => ['parent-links', 'list', filters] as const,
  },
  classes: {
    all: ['classes'] as const,
    list: () => ['classes', 'list'] as const,
    detail: (classId: string) => ['classes', 'detail', classId] as const,
  },
  observations: {
    all: ['observations'] as const,
    queue: (filters: ReviewQueueFilters = {}) => ['observations', 'queue', filters] as const,
    queueCount: (filters: ReviewQueueFilters = {}) => ['observations', 'queue-count', filters] as const,
    detail: (observationId: string) => ['observations', 'detail', observationId] as const,
    teacher: () => ['observations', 'teacher'] as const,
    family: () => ['observations', 'family'] as const,
  },
  activities: {
    all: ['activities'] as const,
    list: (filters: ActivityFilters = {}) => ['activities', 'list', filters] as const,
    detail: (activityId: string) => ['activities', 'detail', activityId] as const,
  },
  assignments: {
    all: ['assignments'] as const,
    mine: () => ['assignments', 'mine'] as const,
    student: (studentId: string) => ['assignments', 'student', studentId] as const,
    child: (studentId: string) => ['assignments', 'child', studentId] as const,
  },
  progress: {
    all: ['progress'] as const,
    growthAreas: (studentId: string) => ['progress', studentId, 'growth-areas'] as const,
    streak: (studentId: string) => ['progress', studentId, 'streak'] as const,
    stars: (studentId: string) => ['progress', studentId, 'stars'] as const,
    monthlySummary: (studentId: string, month: string) =>
      ['progress', studentId, 'monthly-summary', month] as const,
  },
} as const;
