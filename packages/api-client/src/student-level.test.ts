import { describe, expect, it } from 'vitest';
import { levelForCompletedCount, XP_PER_ACTIVITY } from './student-level';

describe('levels and XP, worked out from finished activities', () => {
  it('starts a child with nothing finished at level 1', () => {
    expect(levelForCompletedCount(0)).toEqual({
      level: 1,
      title: 'First Steps',
      xp: 0,
      xpForNextLevel: 100,
      completedCount: 0,
    });
  });

  it('gives every finished activity the same XP and levels up every hundred', () => {
    expect(XP_PER_ACTIVITY).toBe(10);
    expect(levelForCompletedCount(9)).toMatchObject({ level: 1, xp: 90, xpForNextLevel: 100 });
    expect(levelForCompletedCount(10)).toMatchObject({ level: 2, title: 'Busy Bee', xp: 100, xpForNextLevel: 200 });
    expect(levelForCompletedCount(34)).toMatchObject({ level: 4, title: 'Curious Explorer', xp: 340, xpForNextLevel: 400 });
  });

  it('keeps the top title once a child passes the end of the ladder', () => {
    expect(levelForCompletedCount(500).title).toBe('Growth Champion');
  });
});
