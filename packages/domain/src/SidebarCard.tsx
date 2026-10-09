import type { ReactNode } from 'react';
import { cn } from '@evolveiq/ui';

export interface SidebarCardProps {
  title: string;
  children: ReactNode;
  /** A link at the end of the title row. */
  action?: ReactNode;
  className?: string;
}

/**
 * A panel on the night rail where an app puts what this person should know at
 * a glance: a teacher's classes, the review pulse, a parent's children.
 */
export function SidebarCard({ title, children, action, className }: SidebarCardProps) {
  return (
    <section
      className={cn('rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/10', className)}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold text-white/55">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}
