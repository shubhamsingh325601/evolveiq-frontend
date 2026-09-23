import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface EmptyStateProps {
  /** What is not here yet, in the user's terms. */
  title: string;
  /** What to do about it. An empty screen is an invitation to act. */
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-2 rounded-md border border-dashed border-line px-6 py-10',
        className,
      )}
    >
      <p className="text-base font-medium text-ink">{title}</p>
      {description ? <p className="max-w-prose text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
