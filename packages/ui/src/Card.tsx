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
   */
  tone?: 'glass' | 'tinted';
  as?: 'div' | 'section' | 'article' | 'li' | 'aside';
}

/**
 * A translucent surface. It lets the dawn light behind the page through
 * rather than blurring it — only bars and dialogs, which scroll over content,
 * pay for a backdrop blur.
 */
export function Card({
  children,
  className,
  isPlayful = false,
  tone = 'glass',
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      className={cn(
        tone === 'glass'
          ? 'border border-white/80 bg-white/75 shadow-card'
          : 'border border-iris-100/80 bg-iris-50/50',
        isPlayful ? 'rounded-3xl' : 'rounded-2xl',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
