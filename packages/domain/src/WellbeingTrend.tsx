import { useId } from 'react';
import type { WellnessCheckin, WellnessCheckins } from '@evolveiq/api-client';
import { addDays, businessDate } from '@evolveiq/api-client';
import { Card, cn, Lock } from '@evolveiq/ui';
import { ENERGY_LABELS, formatMinutes, MOOD_LABELS } from './wellbeing';

export interface WellbeingTrendProps {
  data: WellnessCheckins;
  /** How many days the chart spans, ending today. */
  days?: number;
  className?: string;
}

const DAY_SHORT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** One entry for each of the last `days` days, with the check-in if there was one. */
export function daysWithCheckins(checkins: WellnessCheckin[], days: number, today: string = businessDate(new Date())) {
  const byDay = new Map(checkins.map((c) => [c.day, c]));
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i - (days - 1));
    return { day, checkin: byDay.get(day) ?? null };
  });
}

function Bars({ title, rows, pick, labels, tone }: {
  title: string;
  rows: ReturnType<typeof daysWithCheckins>;
  pick: (c: WellnessCheckin) => number;
  labels: Record<number, string>;
  tone: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink">{title}</h3>
      <div className="mt-3 flex h-24 items-end gap-1" aria-hidden="true">
        {rows.map(({ day, checkin }) => (
          <span
            key={day}
            title={checkin ? `${DAY_SHORT.format(new Date(`${day}T00:00:00Z`))}: ${labels[pick(checkin)]}` : undefined}
            className={cn('flex-1 rounded-t-md', checkin ? tone : 'bg-line-soft')}
            style={{ height: checkin ? `${(pick(checkin) / 5) * 100}%` : '6%' }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Mood and energy day by day, with the plain averages beside them. The table
 * underneath carries the same numbers for screen readers. When the family has
 * not shared the check-ins with the school, staff see that, and nothing else.
 */
export function WellbeingTrend({ data, days = 14, className }: WellbeingTrendProps) {
  const headingId = useId();
  if (!data.isVisible) {
    return (
      <Card as="section" aria-labelledby={headingId} className={cn('p-6', className)}>
        <h2 id={headingId} className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          <Lock className="size-5 shrink-0 text-ink-faint" />
          Wellbeing check-ins
        </h2>
        <p className="mt-3 text-sm font-medium leading-relaxed text-ink-muted">
          {data.isTracking
            ? 'The family has not shared wellbeing check-ins with the school.'
            : 'The family has not turned on wellbeing check-ins.'}
        </p>
      </Card>
    );
  }

  const rows = daysWithCheckins(data.checkins, days);
  const { summary } = data;
  return (
    <Card as="section" aria-labelledby={headingId} isPlayful className={cn('p-6', className)}>
      <h2 id={headingId} className="text-lg font-black tracking-tight text-ink">
        Wellbeing, last {days} days
      </h2>
      {summary.days === 0 ? (
        <p className="mt-3 text-sm font-medium text-ink-muted">No check-ins in this time yet.</p>
      ) : (
        <>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <Bars title="Mood" rows={rows} pick={(c) => c.mood} labels={MOOD_LABELS} tone="bg-lilac-300" />
            <Bars title="Energy" rows={rows} pick={(c) => c.energy} labels={ENERGY_LABELS} tone="bg-honey-300" />
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Check-ins', String(summary.days)],
              ['Average mood', summary.averageMood === null ? '–' : `${summary.averageMood} of 5`],
              ['Average sleep', summary.averageSleepMinutes === null ? '–' : formatMinutes(summary.averageSleepMinutes)],
              ['Average active time', summary.averageActiveMinutes === null ? '–' : formatMinutes(summary.averageActiveMinutes)],
            ].map(([term, value]) => (
              <div key={term} className="rounded-2xl bg-surface-sunken px-3 py-2.5">
                <dt className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-faint">{term}</dt>
                <dd className="mt-0.5 text-sm font-black text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <table className="sr-only">
            <caption>Wellbeing check-ins</caption>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Mood</th>
                <th scope="col">Energy</th>
                <th scope="col">Sleep</th>
                <th scope="col">Active</th>
              </tr>
            </thead>
            <tbody>
              {data.checkins.map((c) => (
                <tr key={c.day}>
                  <th scope="row">{c.day}</th>
                  <td>{MOOD_LABELS[c.mood]}</td>
                  <td>{ENERGY_LABELS[c.energy]}</td>
                  <td>{c.sleepMinutes === null ? 'Not given' : formatMinutes(c.sleepMinutes)}</td>
                  <td>{c.activeMinutes === null ? 'Not given' : formatMinutes(c.activeMinutes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}
