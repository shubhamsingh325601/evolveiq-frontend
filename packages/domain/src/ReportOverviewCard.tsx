import { Link } from 'react-router-dom';
import { ArrowRight, buttonClasses, Card, cn, Eyebrow, FileText } from '@evolveiq/ui';

export interface ReportOverviewCardProps {
  /** Strongest first; the card shows the top three. */
  strengths: string[];
  yearsTracked: number;
  /** Where the full Holistic Report lives for this child. */
  to: string;
  className?: string;
}

/**
 * The way into the Holistic Report Card, the product's main feature, from a
 * home screen. The whole card opens the report; the link inside it names
 * where it goes.
 */
export function ReportOverviewCard({
  strengths,
  yearsTracked,
  to,
  className,
}: ReportOverviewCardProps) {
  return (
    <Card
      isPlayful
      className={cn(
        'group relative isolate flex flex-col overflow-hidden p-6 transition-[box-shadow,transform] duration-200 hover:shadow-raised active:scale-[0.99]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="absolute right-0 top-0 -z-10 size-32 rounded-bl-full bg-iris-50 transition-transform duration-300 group-hover:scale-110"
      />
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-black tracking-tight text-ink">Holistic Report Card</h2>
          <Eyebrow className="mt-1">Live overview</Eyebrow>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-iris-100 text-iris-600">
          <FileText className="size-5" />
        </span>
      </div>

      {strengths.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-bold text-ink-muted">Top strengths</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {strengths.slice(0, 3).map((strength) => (
              <li
                key={strength}
                className="rounded-md border border-line bg-surface-sunk px-2 py-1 text-[0.6875rem] font-bold text-ink-muted"
              >
                {strength}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Sits at the bottom when a neighbouring card makes this one taller. */}
      <div className="mt-auto pt-5">
        <Link
          to={to}
          className={cn(
            buttonClasses(),
            'h-12 w-full rounded-xl font-bold',
            'after:absolute after:inset-0 after:rounded-3xl',
          )}
        >
          View full {yearsTracked}-year analysis
          <ArrowRight />
        </Link>
      </div>
    </Card>
  );
}
