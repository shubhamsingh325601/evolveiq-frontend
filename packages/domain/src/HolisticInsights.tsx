import type { HolisticInsight } from '@evolveiq/api-client';
import { ArrowDown, ArrowUp, Card, cn, Lightbulb, SectionTitle } from '@evolveiq/ui';
import { HOLISTIC_DIMENSION_COLOR_CLASSES } from './holistic-index';
import { HOLISTIC_DIMENSION_LABELS } from './labels';

export interface HolisticInsightsProps {
  insights: HolisticInsight[];
  className?: string;
}

const CONFIDENCE_LABELS = {
  low: 'Early days: not much to go on yet',
  medium: 'Based on a few things noticed',
  high: 'Based on plenty of evidence',
} as const;

const TREND_LABELS = { up: 'Rising', steady: 'Steady', down: 'Needs a little care' } as const;

/**
 * The "why" behind the Holistic Index: for each pillar, what changed, what fed
 * it, how sure we are, and one thing to try. It is a plain formula over counts
 * (not an AI), so every line here can be traced to something a teacher or
 * parent noticed or an activity the child finished.
 */
export function HolisticInsights({ insights, className }: HolisticInsightsProps) {
  return (
    <section className={className}>
      <SectionTitle icon={Lightbulb} iconClassName="fill-honey-300 text-honey-500">
        Why the score is what it is
      </SectionTitle>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {insights.map((insight) => (
          <Card as="li" isPlayful key={insight.dimension} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={cn('text-[0.625rem] font-bold uppercase tracking-widest', HOLISTIC_DIMENSION_COLOR_CLASSES[insight.dimension])}>
                  {HOLISTIC_DIMENSION_LABELS[insight.dimension]}
                </p>
                <h3 className="mt-0.5 text-[0.9375rem] font-black text-ink">{insight.title}</h3>
              </div>
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider',
                  insight.trend === 'up' && 'border-jade-100 bg-jade-50 text-jade-700',
                  insight.trend === 'steady' && 'border-line bg-surface-sunken text-ink-muted',
                  insight.trend === 'down' && 'border-honey-100 bg-honey-50 text-honey-700',
                )}
              >
                {insight.trend === 'up' ? <ArrowUp className="size-3" strokeWidth={2.5} /> : null}
                {insight.trend === 'down' ? <ArrowDown className="size-3" strokeWidth={2.5} /> : null}
                {TREND_LABELS[insight.trend]}
              </span>
            </div>
            <p className="text-sm font-medium leading-relaxed text-ink-muted">{insight.why}</p>
            <ul className="flex flex-col gap-1 text-xs font-semibold text-ink-muted">
              {insight.factors.map((factor) => (
                <li key={factor} className="flex items-start gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1 shrink-0 rounded-full bg-ink-faint" />
                  {factor}
                </li>
              ))}
            </ul>
            <p className="rounded-xl bg-lilac-50/80 px-3 py-2.5 text-sm font-medium leading-relaxed text-ink">
              <span className="font-bold">Try this: </span>
              {insight.action}
            </p>
            <p className="text-[0.6875rem] font-semibold text-ink-faint">{CONFIDENCE_LABELS[insight.confidence]}</p>
          </Card>
        ))}
      </ul>
    </section>
  );
}
