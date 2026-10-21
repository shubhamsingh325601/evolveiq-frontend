import type { ReactNode } from 'react';
import { cn } from './class-names';

export interface QuoteProps {
  children: ReactNode;
  /** Who wrote it and when, rendered as plain prose beneath the words. */
  attribution?: string;
  className?: string;
  /** `sm` for words in a list, such as a child's stars. */
  size?: 'sm' | 'md' | 'lg';
  /** For words set on an iris-to-lilac surface, such as sign-in. */
  isInverse?: boolean;
}

/**
 * Text a person actually wrote about a child.
 *
 * Two signals mark it, and both are reserved for it: the serif face, and the
 * soft lilac bubble it sits in. Everywhere else EvolvIQ speaks in its own
 * sans, so a reader knows without a label that these are someone's own words.
 */
export function Quote({
  children,
  attribution,
  className,
  size = 'md',
  isInverse = false,
}: QuoteProps) {
  return (
    <figure
      className={cn(
        'max-w-prose rounded-2xl',
        size === 'lg' ? 'px-6 py-5' : size === 'sm' ? 'px-4 py-3' : 'px-5 py-4',
        isInverse ? 'border border-white/20 bg-white/10 backdrop-blur-md' : 'bg-lilac-50/80',
        className,
      )}
    >
      <blockquote
        className={cn(
          'font-serif',
          isInverse ? 'text-white' : 'text-ink',
          size === 'lg' ? 'text-xl leading-9' : size === 'sm' ? 'text-base leading-7' : 'text-lg leading-8',
        )}
      >
        {children}
      </blockquote>
      {attribution ? (
        <figcaption
          className={cn(size === 'sm' ? 'mt-1.5 text-xs' : 'mt-2 text-sm', isInverse ? 'text-white/80' : 'text-ink-muted')}
        >
          {attribution}
        </figcaption>
      ) : null}
    </figure>
  );
}
