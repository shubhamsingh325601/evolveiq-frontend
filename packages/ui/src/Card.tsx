import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface CardProps {
  children: ReactNode;
  className?: string;
  /** Student-facing surfaces use the softer radius. */
  isPlayful?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}

/**
 * A plain bordered surface. Deliberately shadowless — depth in this product is
 * carried by hairlines and spacing, so nothing competes with the one element
 * that is meant to stand out on each screen.
 */
export function Card({ children, className, isPlayful = false, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      className={cn(
        'border border-line bg-surface',
        isPlayful ? 'rounded-lg' : 'rounded-md',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
