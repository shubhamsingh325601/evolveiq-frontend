import { useState } from 'react';
import { cn } from './class-names';

export interface RingsChartSeries {
  key: string;
  label: string;
  /** 0–100. */
  value: number;
  /** A text-colour class. The ring and its legend swatch draw in `currentColor`. */
  colorClass: string;
}

export interface RingsChartProps {
  /** Outermost ring first. Five fit comfortably. */
  series: RingsChartSeries[];
  /** What the centre shows while no ring is picked, such as the overall index. */
  centerValue: number;
  centerLabel: string;
  /** Names the chart for assistive technology. */
  label: string;
  /** For a dark surface such as the sign-in panel. */
  isInverse?: boolean;
  className?: string;
}

const STROKE_WIDTH = 5.5;
const OUTER_RADIUS = 46;
// One stroke plus a two-unit gap in the surface colour, so neighbouring rings
// read as separate marks without an outline drawn round them.
const RING_STEP = STROKE_WIDTH + 2;

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Concentric progress rings, one per series, beside a legend that prints every
 * value. Nothing has to be read from colour alone, and the paler hues never
 * carry their own contrast. Pointing at a ring or a legend row picks it: the
 * other rings step back and the centre shows the picked value. That is a
 * convenience only, since every value is already in the legend.
 */
export function RingsChart({
  series,
  centerValue,
  centerLabel,
  label,
  isInverse = false,
  className,
}: RingsChartProps) {
  const [pickedKey, setPickedKey] = useState<string | null>(null);
  const picked = series.find((item) => item.key === pickedKey);

  return (
    <div className={cn('flex items-center gap-5 sm:gap-7', className)}>
      <div className="relative size-36 shrink-0 sm:size-40">
        <svg viewBox="0 0 100 100" role="img" aria-label={label} className="size-full">
          {series.map((item, index) => {
            const radius = OUTER_RADIUS - index * RING_STEP;
            const isDimmed = picked !== undefined && picked.key !== item.key;
            return (
              <g
                key={item.key}
                className={cn(item.colorClass, 'transition-opacity duration-200', isDimmed && 'opacity-25')}
                onPointerEnter={() => setPickedKey(item.key)}
                onPointerLeave={() => setPickedKey(null)}
              >
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.14}
                  strokeWidth={STROKE_WIDTH}
                />
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={`${clampPercent(item.value)} 100`}
                  transform="rotate(-90 50 50)"
                  className="animate-ring-fill"
                  style={{ animationDelay: `${index * 90}ms` }}
                />
              </g>
            );
          })}
        </svg>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
        >
          <span className={cn('text-2xl font-black leading-none', isInverse ? 'text-white' : 'text-ink')}>
            {picked ? picked.value : centerValue}
          </span>
          {picked ? (
            <span className={cn('mt-1.5 h-1 w-5 rounded-full bg-current', picked.colorClass)} />
          ) : (
            <span
              className={cn(
                'mt-1 text-[0.5625rem] font-bold uppercase tracking-widest',
                isInverse ? 'text-white/60' : 'text-ink-faint',
              )}
            >
              {centerLabel}
            </span>
          )}
        </div>
      </div>

      <ul className="min-w-0 flex-1">
        {series.map((item) => (
          <li
            key={item.key}
            onPointerEnter={() => setPickedKey(item.key)}
            onPointerLeave={() => setPickedKey(null)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
              pickedKey === item.key && (isInverse ? 'bg-white/10' : 'bg-iris-50/80'),
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-2.5 shrink-0 rounded-full bg-current', item.colorClass)}
            />
            <span
              className={cn(
                'min-w-0 flex-1 truncate text-[0.6875rem] font-bold uppercase tracking-wider',
                isInverse ? 'text-white/70' : 'text-ink-muted',
              )}
            >
              {item.label}
            </span>
            <span className={cn('text-sm font-bold tabular-nums', isInverse ? 'text-white' : 'text-ink')}>
              {item.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
