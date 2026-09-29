import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, cn } from '@evolveiq/ui';

export interface BackLinkProps {
  to: string;
  /** Names where it goes, e.g. "Review queue" — not just "Back". */
  children: ReactNode;
  className?: string;
}

/** The way back up one level, placed above a page title. */
export function BackLink({ to, children, className }: BackLinkProps) {
  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center gap-1 rounded-full py-1 pl-1.5 pr-3 text-sm font-medium text-iris-600 transition-colors',
        'hover:bg-iris-50 hover:text-iris-700',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
        className,
      )}
    >
      <ChevronLeft className="size-4" />
      {children}
    </Link>
  );
}
