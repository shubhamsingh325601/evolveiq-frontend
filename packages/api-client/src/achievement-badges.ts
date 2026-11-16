/**
 * Achievement badges, same idea as the level ladder (`student-level.ts`): a
 * frontend idea over data the backend already serves, not a stored record.
 * Distinct from a Star — a star is a specific good thing someone noticed and
 * wrote about; a badge is a milestone crossed, and never carries anyone's
 * words.
 */
export interface AchievementBadgeDefinition {
  id: string;
  /** e.g. "Week streak". */
  label: string;
}

export interface AchievementBadgeInputs {
  streakDays: number;
  starCount: number;
  completedCount: number;
}

const STREAK_MILESTONES: { days: number; id: string; label: string }[] = [
  { days: 3, id: 'streak-3', label: 'On a roll' },
  { days: 7, id: 'streak-7', label: 'Week streak' },
  { days: 30, id: 'streak-30', label: 'Unstoppable' },
];

const STAR_MILESTONES: { count: number; id: string; label: string }[] = [
  { count: 5, id: 'stars-5', label: 'Star collector' },
  { count: 20, id: 'stars-20', label: 'Star champion' },
];

const ACTIVITY_MILESTONES: { count: number; id: string; label: string }[] = [
  { count: 10, id: 'activities-10', label: 'Getting started' },
  { count: 50, id: 'activities-50', label: 'Half century' },
  { count: 100, id: 'activities-100', label: 'Century club' },
];

/** Every milestone crossed so far, most recently reachable first within each kind. */
export function achievementBadges({ streakDays, starCount, completedCount }: AchievementBadgeInputs): AchievementBadgeDefinition[] {
  return [
    ...STREAK_MILESTONES.filter((milestone) => streakDays >= milestone.days),
    ...ACTIVITY_MILESTONES.filter((milestone) => completedCount >= milestone.count),
    ...STAR_MILESTONES.filter((milestone) => starCount >= milestone.count),
  ].map(({ id, label }) => ({ id, label }));
}
