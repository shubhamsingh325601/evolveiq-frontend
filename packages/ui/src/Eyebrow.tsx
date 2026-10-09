import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface EyebrowProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'span';
}

/**
 * The small spaced capitals that sit under a card title or over a figure:
 * "Live overview", "EvolvIQ Holistic Index". Written in sentence case in the
 * source; the capitals are only styling, so screen readers say real words.
 */
export function Eyebrow({ children, className, as: Tag = 'p' }: EyebrowProps) {
  return (
    <Tag
      className={cn(
        'text-[0.625rem] font-bold uppercase leading-4 tracking-widest text-ink-faint',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
