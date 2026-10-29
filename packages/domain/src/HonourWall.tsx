import { useId, type ReactNode } from 'react';
import type { Honour } from '@evolveiq/api-client';
import { cn, EmptyState, LoadingState, Trophy } from '@evolveiq/ui';
import { formatMonth } from './format-date';
import { HonourCard } from './HonourCard';

export interface HonourWallProps {
  honours: Honour[];
  isLoading?: boolean;
  onRemove?: (honour: Honour) => void;
  emptyAction?: ReactNode;
  /** How many months to show, newest first. */
  monthLimit?: number;
  className?: string;
}

/**
 * The celebration wall (client feedback, 29 Oct 2026): each month's Staff of
 * the Month and Students of the Month, newest month first. What a reader sees
 * is already decided by the API — a family sees the Staff of the Month and
 * only their own child.
 */
export function HonourWall({ honours, isLoading = false, onRemove, emptyAction, monthLimit, className }: HonourWallProps) {
  const baseId = useId();
  if (isLoading) return <LoadingState label="Loading the wall" />;
  if (honours.length === 0) {
    return (
      <EmptyState
        className={className}
        icon={Trophy}
        title="No one on the wall yet"
        description="The school names a Staff of the Month and Students of the Month here, with a word on why."
        action={emptyAction}
      />
    );
  }
  const months = [...new Set(honours.map((h) => h.month))].sort().reverse().slice(0, monthLimit);
  return (
    <div className={cn('flex flex-col gap-10', className)}>
      {months.map((month) => {
        const ofMonth = honours
          .filter((h) => h.month === month)
          .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'staff_of_month' ? -1 : 1));
        return (
          <section key={month} aria-labelledby={`${baseId}-${month}`}>
            <h2 id={`${baseId}-${month}`} className="text-lg font-black tracking-tight text-ink">
              {formatMonth(month)}
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {ofMonth.map((honour) => (
                <HonourCard key={honour.id} honour={honour} {...(onRemove ? { onRemove } : {})} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
