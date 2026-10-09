import type { HolisticIndex } from '@evolveiq/api-client';
import { ArrowDown, ArrowUp, Card, cn, Eyebrow, RingsChart } from '@evolveiq/ui';
import {
  changeSinceLastYear,
  firstNameOf,
  HOLISTIC_DIMENSION_COLOR_CLASSES,
  possessive,
} from './holistic-index';
import { HOLISTIC_DIMENSION_LABELS } from './labels';

export interface HolisticIndexCardProps {
  studentName: string;
  index: HolisticIndex;
  className?: string;
}

/**
 * The EvolvIQ Holistic Index at a glance: the score itself, how it moved since
 * last year, and the five pillars it is built from as rings. This is the
 * product's headline number, so it gets the one hero figure on the screen.
 */
export function HolisticIndexCard({ studentName, index, className }: HolisticIndexCardProps) {
  const firstName = firstNameOf(studentName);
  const change = changeSinceLastYear(index);

  return (
    <Card isPlayful className={cn('p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-tight text-ink">
            {possessive(firstName)} score
          </h2>
          <Eyebrow className="mt-1">EvolvIQ Holistic Index</Eyebrow>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-5xl font-black leading-none tracking-tight text-iris-600">
            {index.score}
            <span className="sr-only"> out of 100</span>
          </p>
          {change !== null ? (
            <p
              className={cn(
                'mt-2 inline-flex items-center gap-1 text-xs font-bold',
                change > 0 ? 'text-jade-700' : 'text-ink-muted',
              )}
            >
              {change > 0 ? <ArrowUp className="size-3.5" strokeWidth={2.5} /> : null}
              {change < 0 ? <ArrowDown className="size-3.5" strokeWidth={2.5} /> : null}
              {change === 0
                ? 'Same as last year'
                : `${change > 0 ? '+' : '−'}${Math.abs(change)} since last year`}
            </p>
          ) : null}
        </div>
      </div>

      <RingsChart
        className="mt-6"
        label={`${possessive(firstName)} EvolvIQ Holistic Index, ${index.score}, across its five pillars`}
        centerValue={index.score}
        centerLabel="EHI"
        series={index.dimensions.map((pillar) => ({
          key: pillar.dimension,
          label: HOLISTIC_DIMENSION_LABELS[pillar.dimension],
          value: pillar.score,
          colorClass: HOLISTIC_DIMENSION_COLOR_CLASSES[pillar.dimension],
        }))}
      />
    </Card>
  );
}
