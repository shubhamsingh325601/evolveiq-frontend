import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Student-facing surfaces are one step rounder. */
  isPlayful?: boolean;
  /**
   * `glass` is a surface floating on the dawn backdrop. `tinted` is a quieter
   * panel set inside another surface, such as the teacher-only fields.
   * `night` is the one dark panel a screen may use for its headline figure.
   */
  tone?: 'glass' | 'tinted' | 'night';
  as?: 'div' | 'section' | 'article' | 'li' | 'aside';
  /** The id of the heading that names it — a section with one is a landmark region. */
  'aria-labelledby'?: string;
}

const TONE_CLASSES = {
  glass: 'border border-line/70 bg-white/85 shadow-card',
  tinted: 'border border-iris-100/80 bg-iris-50/50',
  night: 'border border-night-700 bg-insight text-white shadow-raised',
} as const;

/**
 * A translucent surface with a hairline edge. It lets the dawn light behind
 * the page through rather than blurring it — only bars and dialogs, which
 * scroll over content, pay for a backdrop blur.
 */
export function Card({
  children,
  className,
  isPlayful = false,
  tone = 'glass',
  as: Tag = 'div',
  'aria-labelledby': labelledBy,
}: CardProps) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cn(TONE_CLASSES[tone], isPlayful ? 'rounded-3xl' : 'rounded-2xl', className)}
    >
      {children}
    </Tag>
  );
}
