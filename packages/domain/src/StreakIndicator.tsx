import type { StreakInfo } from '@evolveiq/api-client';
import { cn } from '@evolveiq/ui';

export interface StreakIndicatorProps {
  streak: StreakInfo;
  className?: string;
}

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function initialForOffset(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - (6 - offset));
  // getDay() is 0 for Sunday; the row reads Monday-first.
  const index = (date.getDay() + 6) % 7;
  return DAY_INITIALS[index] ?? '';
}

/**
 * Seven marks, one per day. A filled mark is a day something was finished.
 * Deliberately not a big number with a gradient — a child can count the marks
 * and see the gap.
 */
export function StreakIndicator({ streak, className }: StreakIndicatorProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <p className="text-sm text-ink-muted">
        {streak.currentStreak === 0
          ? 'Finish something today to start a run.'
          : `${streak.currentStreak} ${streak.currentStreak === 1 ? 'day' : 'days'} in a row`}
      </p>
      <ul className="flex gap-1.5">
        {streak.lastSevenDays.map((isDone, index) => (
          <li key={index} className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'flex size-9 items-center justify-center rounded-lg border-2 text-sm font-semibold',
                isDone
                  ? 'animate-streak-mark border-moss-500 bg-moss-500 text-white'
                  : 'border-line bg-surface text-ink-faint',
              )}
            >
              <span aria-hidden="true">{isDone ? '✓' : ''}</span>
              <span className="sr-only">{isDone ? 'Finished' : 'Nothing finished'}</span>
            </span>
            <span aria-hidden="true" className="text-xs text-ink-faint">
              {initialForOffset(index)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
