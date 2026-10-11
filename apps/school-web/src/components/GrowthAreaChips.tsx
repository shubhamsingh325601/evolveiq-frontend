import type { GrowthArea } from '@evolveiq/api-client';
import { growthAreaIcon } from '@evolveiq/domain';
import { Badge } from '@evolveiq/ui';

export interface GrowthAreaChipsProps {
  /** Undefined while they load. */
  growthAreas: GrowthArea[] | undefined;
}

const SHOWN = 2;

/** A student's growth areas in a table cell: the first two by name, then a count. */
export function GrowthAreaChips({ growthAreas }: GrowthAreaChipsProps) {
  if (!growthAreas) return <span className="text-ink-faint">…</span>;
  if (growthAreas.length === 0) return <span className="text-ink-faint">None yet</span>;

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {growthAreas.slice(0, SHOWN).map((area) => (
        <Badge key={area.name} tone="growth" icon={growthAreaIcon(area.name)}>
          {area.name}
        </Badge>
      ))}
      {growthAreas.length > SHOWN ? (
        <span className="text-xs font-semibold text-ink-muted">+{growthAreas.length - SHOWN} more</span>
      ) : null}
    </span>
  );
}
