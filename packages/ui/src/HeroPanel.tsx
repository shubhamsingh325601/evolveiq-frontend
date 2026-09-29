import type { ReactNode } from 'react';
import { cn } from './class-names';
import { GrowthRings } from './GrowthRings';

export interface HeroPanelProps {
  title: string;
  description?: ReactNode;
  /** Buttons or links. Use the `inverse` button variant on this surface. */
  actions?: ReactNode;
  /** Anything else the panel carries, such as a student's streak. */
  children?: ReactNode;
  /** Student-facing heroes set the greeting larger. */
  isPlayful?: boolean;
  className?: string;
}

/**
 * The opening panel of a home screen, and the only place the full
 * royal-blue-to-lilac gradient appears. One per screen, at the top.
 */
export function HeroPanel({
  title,
  description,
  actions,
  children,
  isPlayful = false,
  className,
}: HeroPanelProps) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-hero px-6 py-8 text-white shadow-raised sm:px-10 sm:py-10',
        className,
      )}
    >
      <GrowthRings className="absolute -right-32 -top-36 -z-10 size-[30rem] text-white/[0.13] sm:-right-20" />
      <div className="max-w-2xl">
        <h1
          className={cn(
            'font-semibold tracking-tight',
            isPlayful ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl',
          )}
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-prose text-base text-white/90 sm:text-lg">{description}</p>
        ) : null}
      </div>
      {children ? <div className="mt-7">{children}</div> : null}
      {actions ? <div className="mt-7 flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
