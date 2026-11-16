import { describe, expect, it } from 'vitest';
import { achievementBadges } from './achievement-badges';

describe('achievement badges, worked out from streak, stars and finished activities', () => {
  it('gives nothing when nothing has been crossed yet', () => {
    expect(achievementBadges({ streakDays: 0, starCount: 0, completedCount: 0 })).toEqual([]);
  });

  it('gives one badge per milestone crossed, not just the highest', () => {
    const badges = achievementBadges({ streakDays: 7, starCount: 0, completedCount: 0 });
    expect(badges.map((badge) => badge.id)).toEqual(['streak-3', 'streak-7']);
  });

  it('covers streak, activity and star milestones together', () => {
    const badges = achievementBadges({ streakDays: 3, starCount: 5, completedCount: 50 });
    expect(badges.map((badge) => badge.id)).toEqual(['streak-3', 'activities-10', 'activities-50', 'stars-5']);
  });

  it('never gives a milestone not yet reached', () => {
    const badges = achievementBadges({ streakDays: 2, starCount: 4, completedCount: 9 });
    expect(badges).toEqual([]);
  });
});
