import type { ReactNode } from 'react';
import { cn } from './class-names';
import type { IconComponent } from './icons';

export interface EmptyStateProps {
  /** What is not here yet, in the user's terms. */
  title: string;
  /** What to do about it. An empty screen is an invitation to act. */
  description?: string;
  action?: ReactNode;
  /** Names the kind of thing that is missing, e.g. the observations icon. */
  icon?: IconComponent;
  className?: string;
}

export function EmptyState({ title, description, action, icon: Icon, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 rounded-2xl border border-dashed border-iris-200 bg-white/50 px-6 py-7',
        className,
      )}
    >
      {Icon ? (
        <span className="flex size-11 items-center justify-center rounded-xl bg-iris-50 text-iris-500">
          <Icon className="size-5" />
        </span>
      ) : null}
      <div>
        <p className="text-base font-medium text-ink">{title}</p>
        {description ? (
          <p className="mt-1 max-w-prose text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}
