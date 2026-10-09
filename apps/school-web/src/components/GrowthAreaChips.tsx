import { useGrowthAreas } from '@evolveiq/api-client';
import { DEVELOPMENT_AREA_ICONS, DEVELOPMENT_AREA_LABELS } from '@evolveiq/domain';
import { Badge } from '@evolveiq/ui';

export interface GrowthAreaChipsProps {
  studentId: string;
  /** Known from the student record, so the cell can size itself before the areas load. */
  count: number;
}

const SHOWN = 2;

/** A student's open growth areas in a table cell: the first two by name, then a count. */
export function GrowthAreaChips({ studentId, count }: GrowthAreaChipsProps) {
  const growthAreas = useGrowthAreas(count > 0 ? studentId : undefined);

  if (count === 0) return <span className="text-ink-faint">None open</span>;

  const areas = growthAreas.data ?? [];
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {areas.slice(0, SHOWN).map((area) => (
        <Badge key={area.id} tone="growth" icon={DEVELOPMENT_AREA_ICONS[area.area]}>
          {DEVELOPMENT_AREA_LABELS[area.area]}
        </Badge>
      ))}
      {areas.length > SHOWN ? (
        <span className="text-xs font-semibold text-ink-muted">+{areas.length - SHOWN} more</span>
      ) : null}
      {areas.length === 0 ? (
        <span className="tabular-nums text-ink-muted">{count} of 5</span>
      ) : null}
    </span>
  );
}
