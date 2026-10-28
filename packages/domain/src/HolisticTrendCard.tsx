import type { HolisticIndex } from '@evolveiq/api-client';
import { Card, cn, TrendChart, TrendingUp } from '@evolveiq/ui';
import { firstNameOf, monthlyTrendPointsFor, possessive, trendPointsFor, yearsTracked } from './holistic-index';

export interface HolisticTrendCardProps {
  studentName: string;
  index: HolisticIndex;
  className?: string;
}

const CHIP = 'rounded-lg border px-2 py-1 text-[0.625rem] font-bold uppercase tracking-wider';

/**
 * How the EvolvIQ Holistic Index has moved: year by year, and over the last
 * six months. The same card leads a parent's and a student's home and sits in
 * the Holistic Report, so the graph reads the same everywhere.
 */
export function HolisticTrendCard({ studentName, index, className }: HolisticTrendCardProps) {
  const firstName = firstNameOf(studentName);
  const years = yearsTracked(index);

  return (
    <Card isPlayful className={cn('p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          <TrendingUp className="size-5 shrink-0 text-iris-600" />
          Trajectory
        </h2>
        <span className={cn(CHIP, 'border-iris-100 bg-iris-50 text-iris-700')}>{years} yr trend</span>
      </div>
      <TrendChart
        className="mt-4"
        points={trendPointsFor(index)}
        valueName="EHI"
        label={`${possessive(firstName)} EvolvIQ Holistic Index, year by year`}
      />
      {index.monthly.length > 1 ? (
        <>
          <h3 className="mt-6 text-sm font-black text-ink">The last six months</h3>
          <TrendChart
            className="mt-2"
            points={monthlyTrendPointsFor(index)}
            valueName="EHI"
            label={`${possessive(firstName)} EvolvIQ Holistic Index, month by month`}
          />
        </>
      ) : null}
    </Card>
  );
}
