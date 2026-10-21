import type { ReactNode } from 'react';
import { cn } from './class-names';
import type { IconComponent } from './icons';

export type BadgeTone = 'neutral' | 'pending' | 'reviewed' | 'significant' | 'growth' | 'star';

export interface BadgeProps {
  tone?: BadgeTone;
  /** Replaces the status dot, e.g. a development area's own icon. */
  icon?: IconComponent;
  children: ReactNode;
  className?: string;
}

/**
 * Colour is semantic here, never decorative — a reader learns that honey
 * always means "waiting for review", coral always means "flagged
 * significant" and gold always means a star. Status tones carry a dot (a star
 * carries its star) so the meaning survives greyscale.
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-white/80 text-ink-muted ring-line',
  pending: 'bg-honey-50 text-honey-700 ring-honey-100',
  reviewed: 'bg-iris-50 text-iris-700 ring-iris-100',
  significant: 'bg-coral-50 text-coral-700 ring-coral-100',
  growth: 'bg-jade-50 text-jade-700 ring-jade-100',
  star: 'bg-star-50 text-star-800 ring-star-200',
};

const DOT_CLASSES: Record<BadgeTone, string | null> = {
  neutral: null,
  pending: 'bg-honey-500',
  reviewed: 'bg-iris-500',
  significant: 'bg-coral-500',
  growth: 'bg-jade-500',
  star: 'bg-star-500',
};

export function Badge({ tone = 'neutral', icon: Icon, children, className }: BadgeProps) {
  const dot = DOT_CLASSES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {Icon ? (
        // A star badge's icon is the star itself, drawn solid in gold.
        <Icon className={cn('size-3.5 shrink-0', tone === 'star' && 'fill-star-400 text-star-600')} />
      ) : dot ? (
        <span aria-hidden="true" className={cn('size-1.5 shrink-0 rounded-full', dot)} />
      ) : null}
      {children}
    </span>
  );
}
