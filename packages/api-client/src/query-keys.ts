import type { ActivityType, HonourKind, NoticeCategory, ReviewQueueFilters, Role } from './types';

export interface NoticeFilters {
  category?: NoticeCategory;
  /** Platform admins only: one school's notices. */
  schoolId?: string;
}

export interface StaffReviewFilters {
  /** "YYYY-MM". */
  month?: string;
  staffId?: string;
}

export interface HonourFilters {
  /** "YYYY-MM". */
  month?: string;
  kind?: HonourKind;
  /** Platform admins only: one school's wall. */
  schoolId?: string;
}

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
  consents: {
    student: (studentId: string) => ['consents', studentId] as const,
  },
  wellness: {
    all: ['wellness'] as const,
    student: (studentId: string, days: number) => ['wellness', studentId, days] as const,
  },
  supportPlans: {
    student: (studentId: string) => ['support-plans', studentId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  health: {
    all: ['health'] as const,
    student: (studentId: string) => ['health', 'student', studentId] as const,
    class: (classId: string) => ['health', 'class', classId] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    class: (classId: string, from: string, to: string) => ['attendance', classId, from, to] as const,
  },
  notices: {
    all: ['notices'] as const,
    list: (filters: NoticeFilters = {}) => ['notices', 'list', filters] as const,
  },
  staffReviews: {
    all: ['staff-reviews'] as const,
    list: (filters: StaffReviewFilters = {}) => ['staff-reviews', 'list', filters] as const,
  },
  honours: {
    all: ['honours'] as const,
    list: (filters: HonourFilters = {}) => ['honours', 'list', filters] as const,
  },
  progress: {
    all: ['progress'] as const,
    growthAreas: (studentId: string) => ['progress', studentId, 'growth-areas'] as const,
    streak: (studentId: string) => ['progress', studentId, 'streak'] as const,
    stars: (studentId: string) => ['progress', studentId, 'stars'] as const,
    holisticIndex: (studentId: string) => ['progress', studentId, 'holistic-index'] as const,
    growthMoments: (studentId: string) => ['progress', studentId, 'growth-moments'] as const,
    monthlySummary: (studentId: string, month: string) =>
      ['progress', studentId, 'monthly-summary', month] as const,
  },
} as const;
