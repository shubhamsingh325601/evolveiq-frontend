import { cn } from '@evolveiq/ui';
import { ATTENDANCE_WATCH_THRESHOLD } from './school-life';

export interface AttendanceMeterProps {
  /** Days present or late. */
  attended: number;
  /** Days the register was taken. */
  recorded: number;
  /** Read after the figure by screen readers: "this month". */
  period?: string;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Days in out of school days — "18/26 days", the way the client asked to see
 * it on a student's card — with a short bar and the share. Under 75% the bar
 * turns honey, so a child who is often away is easy to spot.
 */
export function AttendanceMeter({ attended, recorded, period, size = 'sm', className }: AttendanceMeterProps) {
  if (recorded === 0) {
    return <span className={cn('text-ink-faint', className)}>No register yet</span>;
  }
  const share = attended / recorded;
  const isLow = share < ATTENDANCE_WATCH_THRESHOLD;
  const percent = Math.round(share * 100);
  return (
    <span className={cn('inline-flex min-w-0 flex-col gap-1', size === 'md' && 'gap-1.5', className)}>
      <span className="flex items-baseline gap-1.5 whitespace-nowrap">
        <span className={cn('font-bold tabular-nums text-ink', size === 'md' ? 'text-2xl font-black' : 'text-sm')}>
          {attended}/{recorded}
        </span>
        <span className={cn('font-semibold text-ink-muted', size === 'md' ? 'text-sm' : 'text-xs')}>
          days{period ? <span className="sr-only"> {period}</span> : null}
        </span>
        <span className={cn('text-xs font-bold tabular-nums', isLow ? 'text-honey-700' : 'text-jade-700')}>{percent}%</span>
      </span>
      <span aria-hidden="true" className={cn('block h-1.5 overflow-hidden rounded-full bg-line-soft', size === 'md' ? 'w-40' : 'w-24')}>
        <span className={cn('block h-full rounded-full', isLow ? 'bg-honey-400' : 'bg-jade-400')} style={{ width: `${percent}%` }} />
      </span>
    </span>
  );
}
