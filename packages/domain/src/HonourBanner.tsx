import type { Honour } from '@evolveiq/api-client';
import { cn, PartyPopper } from '@evolveiq/ui';
import { formatMonth } from './format-date';
import { firstNameOf } from './holistic-index';
import { HONOUR_KIND_LABELS } from './school-life';

export interface HonourBannerProps {
  honour: Honour;
  /** `self`: the honoured person is reading ("You are…"); `family`: their parent. */
  audience: 'self' | 'family';
  className?: string;
}

/**
 * The celebration, said to the person it is for: "You are Student of the Month
 * for October!" on a child's home, or "Arjun is Student of the Month" on their
 * parent's dashboard — the encouragement the client asked for.
 */
export function HonourBanner({ honour, audience, className }: HonourBannerProps) {
  const title = HONOUR_KIND_LABELS[honour.kind];
  const month = formatMonth(honour.month);
  const headline =
    audience === 'self' ? `You are ${title} for ${month}!` : `${firstNameOf(honour.honoree.fullName)} is ${title} for ${month}!`;
  return (
    <section
      aria-label={headline}
      className={cn(
        'relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-star-400 via-honey-400 to-coral-400 p-6 text-night shadow-raised sm:p-7',
        className,
      )}
    >
      <PartyPopper aria-hidden="true" className="absolute -right-3 -top-3 -z-10 size-32 rotate-12 text-white/30" />
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-night/70">
        <PartyPopper className="size-4" /> Congratulations
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{headline}</h2>
      <p className="mt-3 max-w-2xl font-serif text-base leading-relaxed text-night/90 sm:text-lg">“{honour.citation}”</p>
      <p className="mt-3 text-xs font-bold text-night/70">Named by {honour.awardedBy.fullName}</p>
    </section>
  );
}
