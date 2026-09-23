import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface QuoteProps {
  children: ReactNode;
  /** Who wrote it and when, rendered as plain prose beneath the words. */
  attribution?: string;
  className?: string;
  size?: 'md' | 'lg';
}

/**
 * Text a person actually wrote about a child.
 *
 * The serif face is reserved for this: everywhere else in EvolvIQ is the
 * system's own voice in the sans. Seeing the serif tells a reader, without a
 * label, that they are reading someone's own words.
 */
export function Quote({ children, attribution, className, size = 'md' }: QuoteProps) {
  return (
    <figure className={cn('max-w-prose', className)}>
      <blockquote
        className={cn(
          'font-serif text-ink',
          size === 'lg' ? 'text-xl leading-8' : 'text-lg leading-7',
        )}
      >
        {children}
      </blockquote>
      {attribution ? (
        <figcaption className="mt-2 text-sm text-ink-muted">{attribution}</figcaption>
      ) : null}
    </figure>
  );
}
