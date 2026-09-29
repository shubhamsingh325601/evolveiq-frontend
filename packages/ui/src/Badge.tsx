import type { ReactNode } from 'react';
import { cn } from './class-names';
import type { IconComponent } from './icons';

export type BadgeTone = 'neutral' | 'pending' | 'reviewed' | 'significant' | 'growth';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Replaces the status dot, e.g. a development area's own icon. */
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
}

/**
 * Colour is semantic here, never decorative — a reader learns that honey
 * always means "waiting for review" and coral always means "flagged
 * significant". Status tones carry a dot so the meaning survives greyscale.
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-white/80 text-ink-muted ring-line',
  pending: 'bg-honey-50 text-honey-700 ring-honey-100',
  reviewed: 'bg-iris-50 text-iris-700 ring-iris-100',
  significant: 'bg-coral-50 text-coral-700 ring-coral-100',
  growth: 'bg-jade-50 text-jade-700 ring-jade-100',
};

const DOT_CLASSES: Record<BadgeTone, string | null> = {
  neutral: null,
  pending: 'bg-honey-500',
  reviewed: 'bg-iris-500',
  significant: 'bg-coral-500',
  growth: 'bg-jade-500',
};

export function Badge({ tone = 'neutral', icon: Icon, children, className }: BadgeProps) {
  const dot = DOT_CLASSES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon ? (
        <Icon className="size-3.5 shrink-0" />
      ) : dot ? (
        <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      ) : null}
      {children}
    </span>
  );
}
