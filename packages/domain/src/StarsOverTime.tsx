import { useId } from 'react';
import type { Star } from '@evolveiq/api-client';
import { addMonths, businessMonth } from '@evolveiq/api-client';
import { Card, cn, Star as StarIcon } from '@evolveiq/ui';
import { possessive } from './holistic-index';

export interface StarsOverTimeProps {
  stars: Star[];
  name?: string;
  audience: 'student' | 'family' | 'staff';
  /** How many months to show, ending with the current one. */
  months?: number;
  className?: string;
}

const MONTH_SHORT = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });

/** Stars per month, oldest first: the months are Asia/Kolkata calendar months. */
export function starsByMonth(stars: Star[], months: number, now: Date = new Date()): { month: string; count: number }[] {
  const last = businessMonth(now);
  const list = Array.from({ length: months }, (_, i) => addMonths(last, i - (months - 1)));
  return list.map((month) => ({ month, count: stars.filter((s) => businessMonth(s.createdAt) === month).length }));
}

/**
 * Stars earned each month, as bars. The table underneath is the same data for
 * screen readers, so the chart never carries meaning on its own.
 */
export function StarsOverTime({ stars, name, audience, months = 6, className }: StarsOverTimeProps) {
  const headingId = useId();
  const data = starsByMonth(stars, months);
  const top = Math.max(1, ...data.map((d) => d.count));
  const title = audience === 'student' ? 'Your stars, month by month' : name ? `${possessive(name)} stars, month by month` : 'Stars, month by month';

  return (
    <Card as="section" aria-labelledby={headingId} isPlayful className={cn('p-6', className)}>
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
        <StarIcon className="size-5 shrink-0 fill-honey-300 text-honey-500" />
        {title}
      </h2>
      <div className="mt-5 flex h-36 items-end gap-3" aria-hidden="true">
        {data.map((d) => (
          <div key={d.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-xs font-black text-ink">{d.count > 0 ? d.count : ''}</span>
            <span
              className={cn('w-full max-w-10 rounded-t-lg', d.count > 0 ? 'bg-honey-300' : 'bg-line-soft')}
              style={{ height: `${d.count > 0 ? Math.max(8, (d.count / top) * 100) : 4}%` }}
            />
            <span className="text-[0.6875rem] font-bold text-ink-faint">{MONTH_SHORT.format(new Date(`${d.month}-01T00:00:00Z`))}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Stars earned each month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Stars</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.month}>
              <th scope="row">{d.month}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
