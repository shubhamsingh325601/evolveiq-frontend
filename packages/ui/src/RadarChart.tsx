import { useState } from 'react';
import { cn } from './class-names';
import { useElementWidth } from './useElementWidth';

export interface RadarChartAxis {
  label: string;
  /** 0–100. */
  value: number;
}

export interface RadarChartProps {
  /** Three to eight axes, clockwise from the top. Five read best. */
  axes: RadarChartAxis[];
  /** Names the chart for assistive technology; the values are added to it. */
  label: string;
  height?: number;
  className?: string;
}

const GRID_LEVELS = [0.2, 0.4, 0.6, 0.8, 1];
// Room left around the web for the two-line axis labels.
const LABEL_ROOM_X = 72;
const LABEL_ROOM_Y = 36;
const LABEL_OFFSET = 14;

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * A profile across a handful of skills: a filled web on hairline rings, each
 * axis labelled with its name and value so the shape never has to be decoded
 * by eye. Pointing at a corner lifts it.
 */
export function RadarChart({ axes, label, height = 240, className }: RadarChartProps) {
  const [containerRef, width] = useElementWidth<HTMLDivElement>(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const count = axes.length;
  const centerX = width / 2;
  const centerY = height / 2 + 2;
  const radius = Math.max(36, Math.min(width / 2 - LABEL_ROOM_X, height / 2 - LABEL_ROOM_Y));
  const angleAt = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / count;
  const pointAt = (index: number, fraction: number) => ({
    x: centerX + Math.cos(angleAt(index)) * radius * fraction,
    y: centerY + Math.sin(angleAt(index)) * radius * fraction,
  });
  const polygon = (fractions: number[]) =>
    fractions
      .map((fraction, index) => {
        const point = pointAt(index, fraction);
        return `${round(point.x)},${round(point.y)}`;
      })
      .join(' ');

  const valueFractions = axes.map((axis) => Math.min(100, Math.max(0, axis.value)) / 100);
  const description = `${label}: ${axes.map((axis) => `${axis.label} ${axis.value}`).join(', ')}`;

  return (
    <div ref={containerRef} className={cn('text-iris-500', className)}>
      <svg width={width} height={height} role="img" aria-label={description} className="block max-w-full overflow-visible">
        <g className="text-line" fill="none" stroke="currentColor" strokeWidth={1}>
          {GRID_LEVELS.map((level) => (
            <polygon key={level} points={polygon(axes.map(() => level))} />
          ))}
          {axes.map((axis, index) => {
            const end = pointAt(index, 1);
            return (
              <line
                key={axis.label}
                x1={round(centerX)}
                y1={round(centerY)}
                x2={round(end.x)}
                y2={round(end.y)}
              />
            );
          })}
        </g>

        <polygon
          points={polygon(valueFractions)}
          fill="currentColor"
          fillOpacity={0.18}
          stroke="currentColor"
          strokeWidth={2}
          strokeLinejoin="round"
          className="animate-chart-grow"
          style={{ transformOrigin: `${round(centerX)}px ${round(centerY)}px`, transformBox: 'view-box' }}
        />

        {axes.map((axis, index) => {
          const point = pointAt(index, valueFractions[index]!);
          const isActive = index === activeIndex;
          return (
            <g
              key={axis.label}
              className="animate-fade-in"
              onPointerEnter={() => setActiveIndex(index)}
              onPointerLeave={() => setActiveIndex(null)}
            >
              <circle cx={round(point.x)} cy={round(point.y)} r={14} fill="transparent" />
              <circle
                cx={round(point.x)}
                cy={round(point.y)}
                r={isActive ? 6 : 4}
                fill="currentColor"
                stroke="white"
                strokeWidth={2}
                className="transition-[r] duration-150"
              />
            </g>
          );
        })}

        {axes.map((axis, index) => {
          const angle = angleAt(index);
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const x = centerX + cos * (radius + LABEL_OFFSET);
          const y = centerY + sin * (radius + LABEL_OFFSET);
          const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle';
          // Two lines, name then value: lift the pair above a top corner,
          // drop it below a bottom one, and centre it on a side.
          const nameY = sin < -0.8 ? y - 16 : sin > 0.3 ? y + 6 : y - 4;
          const isActive = index === activeIndex;
          return (
            <text key={axis.label} x={round(x)} y={round(nameY)} textAnchor={anchor}>
              <tspan
                className={cn(
                  'text-[0.6875rem] font-bold',
                  isActive ? 'fill-ink' : 'fill-ink-muted',
                )}
              >
                {axis.label}
              </tspan>
              <tspan x={round(x)} dy="1.15em" className="fill-ink text-xs font-black">
                {axis.value}
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
