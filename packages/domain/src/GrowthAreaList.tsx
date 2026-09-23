import type { GrowthArea } from '@evolveiq/api-client';
import { Card, cn } from '@evolveiq/ui';
import { DEVELOPMENT_AREA_LABELS } from './labels';
import { formatDay } from './format-date';

export interface GrowthAreaListProps {
  growthAreas: GrowthArea[];
  className?: string;
}

/**
 * A student's open growth areas. The PRD caps this at five, so the list is
 * always short enough to read at a glance — no chart required, and charts are
 * out of scope for the MVP.
 */
export function GrowthAreaList({ growthAreas, className }: GrowthAreaListProps) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {growthAreas.map((area) => {
        const total = Math.max(area.activitiesAssigned, 1);
        const doneRatio = area.activitiesCompleted / total;
        return (
          <Card as="li" key={area.id} className="px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-medium text-ink">
                {DEVELOPMENT_AREA_LABELS[area.area]}
              </h3>
              <p className="text-sm tabular-nums text-ink-muted">
                {area.activitiesCompleted} of {area.activitiesAssigned} activities done
              </p>
            </div>
            <p className="mt-1 max-w-prose text-sm text-ink-muted">{area.summary}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line-soft">
              <div
                className="h-full rounded-full bg-moss-500"
                style={{ width: `${Math.round(doneRatio * 100)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-ink-faint">
              Being worked on since {formatDay(area.openedAt)}
            </p>
          </Card>
        );
      })}
    </ul>
  );
}
