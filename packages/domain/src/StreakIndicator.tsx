import { addDays, businessDate } from '@evolveiq/api-client';
import { Check, cn } from '@evolveiq/ui';

export interface StreakIndicatorProps {
  /** Consecutive days with something finished, as the backend counts them. */
  days: number;
  /**
   * The last seven days, oldest first, when the screen knows them (a student,
   * or staff looking at a student's finished activities). Without them only
   * the count is shown.
   */
  lastSevenDays?: boolean[];
  /** Drawn in white for use on a hero panel. */
  isInverse?: boolean;
  className?: string;
}

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function initialForOffset(offset: number): string {
  // Asia/Kolkata days, the same days the streak is counted in.
  const day = addDays(businessDate(), offset - 6);
  // getUTCDay() is 0 for Sunday; the row reads Monday-first.
  const index = (new Date(`${day}T00:00:00.000Z`).getUTCDay() + 6) % 7;
  return DAY_INITIALS[index] ?? '';
}

/**
 * Seven marks, one per day. A filled mark is a day something was finished.
 * Deliberately not a big number with a gradient — a child can count the marks
 * and see the gap. Filled marks are jade: finishing work is growth.
 */
export function StreakIndicator({ days, lastSevenDays, isInverse = false, className }: StreakIndicatorProps) {
  const lastIndex = (lastSevenDays?.length ?? 0) - 1;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <p className={cn('text-sm font-medium', isInverse ? 'text-white/90' : 'text-ink-muted')}>
        {days === 0
          ? 'Finish something today to start a run.'
          : `${days} ${days === 1 ? 'day' : 'days'} in a row`}
      </p>
      {lastSevenDays ? (
        <ul className="flex gap-2 sm:gap-2.5">
          {lastSevenDays.map((isDone, index) => {
            const isToday = index === lastIndex;
            return (
              <li key={index} className="flex flex-col items-center gap-1.5">
                <span
                  style={isDone ? { animationDelay: `${index * 70}ms` } : undefined}
                  className={cn(
                    'flex size-9 items-center justify-center rounded-full sm:size-10',
                    isDone
                      ? isInverse
                        ? 'animate-streak-mark bg-white text-jade-600 shadow-[0_6px_16px_-6px_rgba(23,21,59,0.45)]'
                        : 'animate-streak-mark bg-jade-500 text-white shadow-[0_6px_16px_-6px_rgba(31,168,120,0.8)]'
                      : isInverse
                        ? 'border-2 border-dashed border-white/40'
                        : 'border-2 border-dashed border-iris-200 bg-white/60',
                  )}
                >
                  {isDone ? <Check className="size-4" strokeWidth={3} /> : null}
                  <span className="sr-only">{isDone ? 'Finished' : 'Nothing finished'}</span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-xs',
                    isInverse ? 'text-white/70' : 'text-ink-faint',
                    isToday && (isInverse ? 'font-semibold text-white' : 'font-semibold text-ink'),
                  )}
                >
                  {initialForOffset(index)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
