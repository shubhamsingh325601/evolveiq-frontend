import type { HealthCondition } from '@evolveiq/api-client';
import { cn, HeartPulse } from '@evolveiq/ui';
import { HEALTH_CONDITION_LABELS } from './school-life';

export interface CareFlagsProps {
  conditions: HealthCondition[] | undefined;
  /** Care notes without a named condition still mean "read before you teach". */
  hasNotes?: boolean;
  /** How many names to show before "+2". */
  limit?: number;
  className?: string;
}

/**
 * A child's care needs as a row of chips on a roster or a list: "Asthma",
 * "ADHD", "+1". Nothing recorded reads as a quiet dash, so the chips stand out
 * on the students who need special care.
 */
export function CareFlags({ conditions = [], hasNotes = false, limit = 2, className }: CareFlagsProps) {
  if (conditions.length === 0) {
    return hasNotes ? (
      <span className={cn('inline-flex items-center gap-1 text-xs font-bold text-coral-700', className)}>
        <HeartPulse className="size-3.5" /> Care notes
      </span>
    ) : (
      <span className={cn('text-ink-faint', className)}>None recorded</span>
    );
  }
  const shown = conditions.slice(0, limit);
  const rest = conditions.length - shown.length;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      <HeartPulse aria-hidden="true" className="size-3.5 text-coral-500" />
      {shown.map((condition) => (
        <span
          key={condition}
          className="whitespace-nowrap rounded-full bg-coral-50 px-2 py-0.5 text-xs font-bold text-coral-700 ring-1 ring-inset ring-coral-100"
        >
          {HEALTH_CONDITION_LABELS[condition]}
        </span>
      ))}
      {rest > 0 ? (
        <span className="text-xs font-bold text-coral-700" title={conditions.slice(limit).map((c) => HEALTH_CONDITION_LABELS[c]).join(', ')}>
          +{rest}
          <span className="sr-only"> more: {conditions.slice(limit).map((c) => HEALTH_CONDITION_LABELS[c]).join(', ')}</span>
        </span>
      ) : null}
    </span>
  );
}
