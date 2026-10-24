import { describe, expect, it } from 'vitest';
import type { Star } from '@evolveiq/api-client';
import { starsByMonth } from './StarsOverTime';

const star = (id: string, createdAt: string): Star => ({
  id,
  studentId: 'stu-maya',
  area: 'communication',
  description: 'Helped a friend',
  givenBy: { fullName: 'Ms Rao', role: 'teacher' },
  createdAt,
});

describe('starsByMonth', () => {
  const now = new Date('2026-10-20T06:00:00.000Z');

  it('returns one bucket per month, oldest first, ending in the current month', () => {
    const result = starsByMonth([], 4, now);
    expect(result.map((r) => r.month)).toEqual(['2026-07', '2026-08', '2026-09', '2026-10']);
    expect(result.every((r) => r.count === 0)).toBe(true);
  });

  it('counts stars in the month they were given, in Asia/Kolkata time', () => {
    const result = starsByMonth(
      [
        star('a', '2026-10-02T05:00:00.000Z'),
        star('b', '2026-10-15T05:00:00.000Z'),
        star('c', '2026-09-30T20:00:00.000Z'), // 01:30 on 1 Oct in Kolkata
        star('d', '2026-08-10T05:00:00.000Z'),
        star('e', '2025-01-10T05:00:00.000Z'), // outside the window
      ],
      4,
      now,
    );
    expect(Object.fromEntries(result.map((r) => [r.month, r.count]))).toEqual({
      '2026-07': 0,
      '2026-08': 1,
      '2026-09': 0,
      '2026-10': 3,
    });
  });
});
