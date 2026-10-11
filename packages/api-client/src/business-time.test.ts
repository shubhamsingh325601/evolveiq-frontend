import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  businessDate,
  businessMonth,
  currentStreak,
  lastSevenDays,
  longestRun,
} from './business-time';

describe('business days are Asia/Kolkata days, as on the backend', () => {
  it('puts 00:15 IST on 1 November (18:45 UTC on 31 October) on 1 November', () => {
    expect(businessDate('2026-10-31T18:45:00.000Z')).toBe('2026-11-01');
    expect(businessMonth('2026-10-31T18:45:00.000Z')).toBe('2026-11');
    expect(businessDate('2026-10-31T18:00:00.000Z')).toBe('2026-10-31');
  });

  it('steps days and months across their ends', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(addMonths('2026-11', 2)).toBe('2027-01');
  });
});

describe('streaks', () => {
  const today = '2026-10-11';

  it('counts back from today, or from yesterday while today has nothing yet', () => {
    expect(currentStreak(['2026-10-09', '2026-10-10', '2026-10-11'], today)).toBe(3);
    expect(currentStreak(['2026-10-09', '2026-10-10'], today)).toBe(2);
    expect(currentStreak(['2026-10-08', '2026-10-09'], today)).toBe(0);
    expect(currentStreak([], today)).toBe(0);
  });

  it('finds the longest run, ignoring repeats', () => {
    expect(longestRun(['2026-10-01', '2026-10-02', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07'])).toBe(3);
    expect(longestRun([])).toBe(0);
  });

  it('marks the last seven days, oldest first', () => {
    expect(lastSevenDays(['2026-10-05', '2026-10-10', '2026-10-11', '2026-10-01'], today)).toEqual([
      true,
      false,
      false,
      false,
      false,
      true,
      true,
    ]);
  });
});
