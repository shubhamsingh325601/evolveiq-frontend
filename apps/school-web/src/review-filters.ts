import type { ReviewQueueFilters } from '@evolveiq/api-client';

/**
 * The counsellor's queue filters, in one place for the queue's tiles, the
 * review pulse on the rail and the bell. Every one asks for concerns only:
 * something good is a star for the student, never something to review.
 */
export const REVIEW_FILTERS = {
  pending: { tone: 'concern', status: 'pending' },
  significant: { tone: 'concern', level: 'significant' },
  'from-parents': { tone: 'concern', authorRole: 'parent' },
  reviewed: { tone: 'concern', status: 'reviewed' },
  all: { tone: 'concern' },
} satisfies Record<string, ReviewQueueFilters>;

export type ReviewFilter = keyof typeof REVIEW_FILTERS;
