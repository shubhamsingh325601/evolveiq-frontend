import type { GrowthArea } from '@evolveiq/api-client';
import { Card, cn } from '@evolveiq/ui';
import { DEVELOPMENT_AREA_ICONS } from './area-icons';
import { DEVELOPMENT_AREA_LABELS } from './labels';
import { formatDay } from './format-date';

export interface GrowthAreaListProps {
  growthAreas: GrowthArea[];
  className?: string;
}

/**
 * A student's open growth areas. The PRD caps this at five, so the list is
 * always short enough to read at a glance — no chart required, and charts are
 * out of scope for the MVP. The bar counts activities, never a score.
 */
export function GrowthAreaList({ growthAreas, className }: GrowthAreaListProps) {
  return (
    <ul className={cn('grid gap-3', className)}>
      {growthAreas.map((area) => {
        const total = Math.max(area.activitiesAssigned, 1);
        const percentDone = Math.round((area.activitiesCompleted / total) * 100);
        const AreaIcon = DEVELOPMENT_AREA_ICONS[area.area];
        return (
          <Card as="li" key={area.id} className="flex flex-col p-5">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-jade-50 text-jade-600">
                <AreaIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <h3 className="text-base font-medium text-ink">
                    {DEVELOPMENT_AREA_LABELS[area.area]}
                  </h3>
                  <p className="text-sm tabular-nums text-ink-muted">
                    {area.activitiesCompleted} of {area.activitiesAssigned} activities done
                  </p>
                </div>
                <p className="mt-1 max-w-prose text-sm text-ink-muted">{area.summary}</p>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-jade-50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-jade-400 to-jade-500"
                  style={{ width: `${percentDone}%` }}
                />
              </div>
              <p className="mt-2.5 text-xs text-ink-faint">
                Being worked on since {formatDay(area.openedAt)}
              </p>
            </div>
          </Card>
        );
      })}
    </ul>
  );
}
