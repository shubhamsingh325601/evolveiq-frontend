import { cn } from './class-names';

export type BadgeTone = 'neutral' | 'pending' | 'reviewed' | 'significant' | 'growth';

export interface BadgeProps {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}

/**
 * Colour is semantic here, never decorative — a reader learns that amber always
 * means "waiting for review" and raspberry always means "flagged significant".
 */
const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunk text-ink-muted border-line',
  pending: 'bg-amber-50 text-amber-700 border-amber-100',
  reviewed: 'bg-teal-50 text-teal-700 border-teal-100',
  significant: 'bg-raspberry-50 text-raspberry-700 border-raspberry-100',
  growth: 'bg-moss-50 text-moss-700 border-moss-100',
};

export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
