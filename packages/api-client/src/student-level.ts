import type { StudentLevel } from './types';

/**
 * Levels and XP are a frontend idea: the backend counts finished activities,
 * and this turns the count into a ladder a child can climb. Every finished
 * activity is worth the same; each level needs another hundred XP.
 */
export const XP_PER_ACTIVITY = 10;

const XP_PER_LEVEL = 100;

export const LEVEL_TITLES = [
  'First Steps',
  'Busy Bee',
  'Bright Spark',
  'Curious Explorer',
  'Brave Builder',
  'Story Weaver',
  'Puzzle Solver',
  'Rising Star',
  'Trailblazer',
  'Growth Champion',
] as const;

export function levelForCompletedCount(completedCount: number): StudentLevel {
  const xp = Math.max(0, completedCount) * XP_PER_ACTIVITY;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const title = LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? LEVEL_TITLES[0];
  return { level, title, xp, xpForNextLevel: level * XP_PER_LEVEL, completedCount };
}
