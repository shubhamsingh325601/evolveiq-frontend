import type { GrowthArea } from '@evolveiq/api-client';
import { Card, cn } from '@evolveiq/ui';
import { growthAreaIcon } from './area-icons';

export interface GrowthAreaListProps {
  growthAreas: GrowthArea[];
  className?: string;
}

/**
 * A student's growth areas: what the school is working on with them, newest
 * first. The PRD caps this at five, so the list is always short enough to read
 * at a glance. Names only — never a score, never the observations behind it.
 */
export function GrowthAreaList({ growthAreas, className }: GrowthAreaListProps) {
  return (
    <ul className={cn('grid gap-3', className)}>
      {growthAreas.map((area, index) => {
        const AreaIcon = growthAreaIcon(area.name);
        return (
          <Card as="li" key={area.name} className="flex items-center gap-4 p-4 sm:p-5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-jade-50 text-jade-600">
              <AreaIcon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-ink">{area.name}</h3>
              <p className="mt-0.5 text-sm text-ink-muted">
                {index === 0 ? 'The newest one being worked on' : 'Being worked on'}
              </p>
            </div>
          </Card>
        );
      })}
    </ul>
  );
}
