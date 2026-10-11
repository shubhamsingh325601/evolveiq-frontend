import { Flame } from '@evolveiq/ui';

export interface StreakFlameProps {
  days: number;
}

/** The streak as a flame and a count, beside the student's greeting. */
export function StreakFlame({ days }: StreakFlameProps) {
  return (
    <p className="flex shrink-0 flex-col items-center rounded-2xl border border-flame-200 bg-flame-50 px-3 py-1.5 shadow-card">
      <Flame aria-hidden="true" className="size-5 fill-flame-500 text-flame-500" />
      <span className="text-xs font-black tabular-nums text-flame-700">
        {days}
        <span className="sr-only">-day streak</span>
      </span>
    </p>
  );
}
