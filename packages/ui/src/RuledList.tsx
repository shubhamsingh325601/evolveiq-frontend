import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface RuledListProps {
  children: ReactNode;
  className?: string;
}

/**
 * A chronology drawn as a notebook margin: one continuous hairline down the
 * left, entries hanging off it. The rule is the structure, so nothing needs a
 * card around it.
 */
export function RuledList({ children, className }: RuledListProps) {
  return (
    <ol className={cn('relative ml-1 border-l border-line pl-6', className)}>{children}</ol>
  );
}

export interface RuledListItemProps {
  children: ReactNode;
  /** Draws the marker in a semantic colour rather than the default ink. */
  tone?: 'default' | 'pending' | 'significant' | 'growth';
  className?: string;
}

const MARKER_CLASSES: Record<NonNullable<RuledListItemProps['tone']>, string> = {
  default: 'bg-line-strong',
  pending: 'bg-amber-500',
  significant: 'bg-raspberry-500',
  growth: 'bg-moss-500',
};

export function RuledListItem({ children, tone = 'default', className }: RuledListItemProps) {
  return (
    <li className={cn('relative pb-7 last:pb-0', className)}>
      <span
        aria-hidden="true"
        className={cn(
          'absolute -left-[1.8125rem] top-2 size-2 rounded-full ring-4 ring-paper',
          MARKER_CLASSES[tone],
        )}
      />
      {children}
    </li>
  );
}
