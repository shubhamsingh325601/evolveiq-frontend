import { useId, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { cn } from './class-names';
import { useElementWidth } from './useElementWidth';

export interface TrendChartPoint {
  /** Short label under the axis, such as "Y3". */
  label: string;
  value: number;
  /** The fuller description the readout uses, such as "Year 3, 2025–26". */
  detail: string;
}

export interface TrendChartProps {
  /** Oldest first. */
  points: TrendChartPoint[];
  /** The measure's name in the readout, such as "EHI". */
  valueName: string;
  /** Names the chart for assistive technology. */
  label: string;
  /** Plot height in px, not counting the axis labels underneath. */
  plotHeight?: number;
  className?: string;
}

const MARGIN = { top: 26, right: 20, bottom: 28, left: 30 };
const MIN_LABEL_SPACING = 34;

type Coordinate = { x: number; y: number };

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A smooth line that never overshoots the data between two points
 * (Fritsch–Carlson monotone cubic), so a rise always reads as a rise.
 */
function monotonePath(coordinates: Coordinate[]): string {
  const count = coordinates.length;
  const first = coordinates[0];
  if (!first) return '';
  if (count === 1) return `M${round(first.x)},${round(first.y)}`;

  const gaps: number[] = [];
  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index += 1) {
    const from = coordinates[index]!;
    const to = coordinates[index + 1]!;
    gaps.push(to.x - from.x);
    slopes.push((to.y - from.y) / (to.x - from.x));
  }

  const tangents: number[] = [slopes[0]!];
  for (let index = 1; index < count - 1; index += 1) {
    const before = slopes[index - 1]!;
    const after = slopes[index]!;
    if (before * after <= 0) {
      tangents.push(0);
    } else {
      const weightAfter = 2 * gaps[index]! + gaps[index - 1]!;
      const weightBefore = gaps[index]! + 2 * gaps[index - 1]!;
      tangents.push((weightAfter + weightBefore) / (weightAfter / before + weightBefore / after));
    }
  }
  tangents.push(slopes[count - 2]!);

  let path = `M${round(first.x)},${round(first.y)}`;
  for (let index = 0; index < count - 1; index += 1) {
    const from = coordinates[index]!;
    const to = coordinates[index + 1]!;
    const third = gaps[index]! / 3;
    path +=
      ` C${round(from.x + third)},${round(from.y + third * tangents[index]!)}` +
      ` ${round(to.x - third)},${round(to.y - third * tangents[index + 1]!)}` +
      ` ${round(to.x)},${round(to.y)}`;
  }
  return path;
}

/** Whole tens around the data, with room above the highest point for its label. */
function valueDomain(values: number[]): [number, number] {
  const low = Math.max(0, Math.floor((Math.min(...values) - 6) / 10) * 10);
  const high = Math.min(100, Math.ceil((Math.max(...values) + 4) / 10) * 10);
  return high - low < 20 ? [Math.max(0, high - 20), high] : [low, high];
}

/**
 * One measure over time as a soft area under a 2px line. Gridlines are solid
 * hairlines, the latest value is labelled at the end of the line, and a
 * crosshair readout follows the pointer, snapping to the nearest point.
 * Keyboard users focus the chart and read it with the arrow keys.
 */
export function TrendChart({
  points,
  valueName,
  label,
  plotHeight = 156,
  className,
}: TrendChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>(320);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const gradientId = `trend-${useId().replace(/:/g, '')}`;
  const summaryId = `${gradientId}-summary`;

  if (points.length === 0) return null;

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 60);
  const height = MARGIN.top + plotHeight + MARGIN.bottom;
  const baseline = MARGIN.top + plotHeight;
  const [low, high] = valueDomain(points.map((point) => point.value));
  const tickStep = high - low > 40 ? 20 : 10;
  const ticks: number[] = [];
  for (let tick = low; tick <= high; tick += tickStep) ticks.push(tick);

  const xAt = (index: number) =>
    MARGIN.left + (points.length === 1 ? plotWidth / 2 : (index * plotWidth) / (points.length - 1));
  const yAt = (value: number) => baseline - ((value - low) / (high - low)) * plotHeight;
  const coordinates = points.map((point, index) => ({ x: xAt(index), y: yAt(point.value) }));

  const line = monotonePath(coordinates);
  const firstX = round(coordinates[0]!.x);
  const lastIndex = points.length - 1;
  const last = coordinates[lastIndex]!;
  const area = `${line} L${round(last.x)},${baseline} L${firstX},${baseline} Z`;

  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(1, Math.floor(plotWidth / MIN_LABEL_SPACING))));

  const active = activeIndex === null ? null : { point: points[activeIndex]!, at: coordinates[activeIndex]! };
  const readoutBelow = active !== null && active.at.y < 64;

  const pickFromPointer = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    let nearest = 0;
    coordinates.forEach((coordinate, index) => {
      if (Math.abs(coordinate.x - x) < Math.abs(coordinates[nearest]!.x - x)) nearest = index;
    });
    setActiveIndex(nearest);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = activeIndex ?? lastIndex;
    const next =
      event.key === 'ArrowLeft'
        ? Math.max(0, current - 1)
        : event.key === 'ArrowRight'
          ? Math.min(lastIndex, current + 1)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? lastIndex
              : null;
    if (next === null) return;
    event.preventDefault();
    setActiveIndex(next);
  };

  const firstPoint = points[0]!;
  const lastPoint = points[lastIndex]!;

  return (
    <div
      ref={containerRef}
      role="group"
      aria-roledescription="chart"
      aria-label={label}
      aria-describedby={summaryId}
      tabIndex={0}
      onFocus={() => setActiveIndex(lastIndex)}
      onBlur={() => setActiveIndex(null)}
      onKeyDown={onKeyDown}
      className={cn(
        'relative rounded-xl text-iris-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-iris-500',
        className,
      )}
    >
      <p id={summaryId} className="sr-only">
        {`${valueName} ${firstPoint.value} in ${firstPoint.detail}, ${lastPoint.value} in ${lastPoint.detail}. Use the arrow keys to read each point.`}
      </p>

      <svg
        width={width}
        height={height}
        aria-hidden="true"
        className="block max-w-full touch-pan-y overflow-visible"
        onPointerMove={pickFromPointer}
        onPointerDown={pickFromPointer}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity={0.22} />
            <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g className="text-line">
          {ticks.map((tick) => (
            <line
              key={tick}
              x1={MARGIN.left}
              x2={MARGIN.left + plotWidth}
              y1={round(yAt(tick))}
              y2={round(yAt(tick))}
              stroke="currentColor"
              strokeWidth={1}
              shapeRendering="crispEdges"
            />
          ))}
        </g>
        {ticks.map((tick) => (
          <text
            key={tick}
            x={MARGIN.left - 8}
            y={round(yAt(tick))}
            dy="0.32em"
            textAnchor="end"
            className="fill-ink-faint text-[0.625rem] tabular-nums"
          >
            {tick}
          </text>
        ))}

        <path d={area} fill={`url(#${gradientId})`} className="animate-fade-in" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          className="animate-line-draw"
        />

        {points.map((point, index) =>
          index % labelEvery === 0 || index === lastIndex ? (
            <text
              key={point.detail}
              x={round(xAt(index))}
              y={baseline + 18}
              textAnchor="middle"
              className={cn(
                'text-[0.625rem] font-bold',
                index === activeIndex ? 'fill-ink' : 'fill-ink-faint',
              )}
            >
              {point.label}
            </text>
          ) : null,
        )}

        {active ? (
          <line
            x1={round(active.at.x)}
            x2={round(active.at.x)}
            y1={MARGIN.top - 6}
            y2={baseline}
            className="stroke-line-strong"
            strokeWidth={1}
            shapeRendering="crispEdges"
          />
        ) : null}

        <g className="animate-fade-in">
          <circle
            cx={round(last.x)}
            cy={round(last.y)}
            r={4}
            fill="currentColor"
            stroke="white"
            strokeWidth={2}
          />
          <text
            x={round(last.x)}
            y={round(last.y) - 12}
            textAnchor="end"
            className="fill-ink text-xs font-black"
          >
            {lastPoint.value}
          </text>
        </g>

        {active && activeIndex !== lastIndex ? (
          <circle
            cx={round(active.at.x)}
            cy={round(active.at.y)}
            r={4.5}
            fill="currentColor"
            stroke="white"
            strokeWidth={2}
          />
        ) : null}
      </svg>

      {active ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 min-w-[7.5rem] rounded-xl border border-line-soft bg-white px-3 py-2 shadow-overlay"
          style={{
            left: Math.min(Math.max(active.at.x, 64), width - 64),
            top: readoutBelow ? active.at.y + 14 : active.at.y - 14,
            transform: readoutBelow ? 'translateX(-50%)' : 'translate(-50%, -100%)',
          }}
        >
          <p className="flex items-baseline gap-1.5">
            <span className="text-lg font-black leading-6 text-ink">{active.point.value}</span>
            <span className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-faint">
              {valueName}
            </span>
          </p>
          <p className="whitespace-nowrap text-xs text-ink-muted">{active.point.detail}</p>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {active ? `${active.point.detail}: ${valueName} ${active.point.value}` : ''}
      </p>
    </div>
  );
}
