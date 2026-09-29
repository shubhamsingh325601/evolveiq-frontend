import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface PageHeaderProps {
  title: string;
  /** One line of orienting detail. Kept as prose, not a run of separators. */
  subtitle?: string;
  actions?: ReactNode;
  /** The way back up a level, drawn above the title — usually a `BackLink`. */
  back?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, back, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {back ? <div className="mb-4">{back}</div> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-prose text-base text-ink-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}
