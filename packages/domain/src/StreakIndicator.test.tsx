import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StreakIndicator } from './StreakIndicator';

describe('StreakIndicator', () => {
  it('invites a child to start when there is no run yet', () => {
    render(<StreakIndicator days={0} />);

    expect(screen.getByText('Finish something today to start a run.')).toBeInTheDocument();
  });

  it('counts a run in days, singular and plural', () => {
    const { rerender } = render(<StreakIndicator days={1} />);
    expect(screen.getByText('1 day in a row')).toBeInTheDocument();

    rerender(<StreakIndicator days={3} />);
    expect(screen.getByText('3 days in a row')).toBeInTheDocument();
  });

  it('draws one mark per day when the days are known', () => {
    render(<StreakIndicator days={2} lastSevenDays={[false, false, true, false, false, true, true]} />);

    expect(screen.getAllByText('Finished')).toHaveLength(3);
    expect(screen.getAllByText('Nothing finished')).toHaveLength(4);
  });
});
