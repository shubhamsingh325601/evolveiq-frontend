import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakIndicator } from './StreakIndicator';

describe('StreakIndicator', () => {
  it('invites a child to start when there is no run yet', () => {
    render(
      <StreakIndicator
        streak={{
          studentId: 'stu-maya',
          currentStreak: 0,
          longestStreak: 0,
          lastSevenDays: [false, false, false, false, false, false, false],
        }}
      />,
    );

    expect(screen.getByText('Finish something today to start a run.')).toBeInTheDocument();
  });

  it('counts a run in days, singular and plural', () => {
    const { rerender } = render(
      <StreakIndicator
        streak={{
          studentId: 'stu-maya',
          currentStreak: 1,
          longestStreak: 1,
          lastSevenDays: [false, false, false, false, false, false, true],
        }}
      />,
    );
    expect(screen.getByText('1 day in a row')).toBeInTheDocument();

    rerender(
      <StreakIndicator
        streak={{
          studentId: 'stu-maya',
          currentStreak: 3,
          longestStreak: 3,
          lastSevenDays: [false, false, false, false, true, true, true],
        }}
      />,
    );
    expect(screen.getByText('3 days in a row')).toBeInTheDocument();
  });
});
