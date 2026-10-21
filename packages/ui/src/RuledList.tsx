import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface RuledListProps {
  children: ReactNode;
  className?: string;
}

/**
 * A chronology: entries hang off a soft rule that runs from each marker to the
 * next and stops at the last one. The rule is the structure, so the entries
 * themselves need no card around them.
 */
export function RuledList({ children, className }: RuledListProps) {
  return <ol className={cn('flex flex-col', className)}>{children}</ol>;
}

export interface RuledListItemProps {
  children: ReactNode;
  /** Draws the marker in a semantic colour rather than the default iris. */
  tone?: 'default' | 'pending' | 'significant' | 'growth' | 'star';
  className?: string;
}

const MARKER_CLASSES: Record<NonNullable<RuledListItemProps['tone']>, string> = {
  default: 'bg-iris-300',
  pending: 'bg-honey-400',
  significant: 'bg-coral-500',
  growth: 'bg-jade-500',
  star: 'bg-star-400',
};

export function RuledListItem({ children, tone = 'default', className }: RuledListItemProps) {
  return (
    <li className={cn('group/entry relative pb-9 pl-8 last:pb-0', className)}>
      <span
        aria-hidden="true"
        className="absolute bottom-0 left-[5px] top-6 w-0.5 rounded-full bg-gradient-to-b from-iris-200 to-lilac-200/50 group-last/entry:hidden"
      />
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-1 size-3 rounded-full ring-4 ring-white/90',
          MARKER_CLASSES[tone],
        )}
      />
      {children}
    </li>
  );
}
