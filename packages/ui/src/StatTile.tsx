import type { ReactNode } from 'react';
import { cn } from './class-names';
import type { IconComponent } from './icons';

export type StatTileTone = 'iris' | 'lilac' | 'jade' | 'honey' | 'coral' | 'night';

export interface StatTileProps {
  label: string;
  value: ReactNode;
  icon: IconComponent;
  /**
   * The icon well's colour, which follows the hue's meaning: honey for what
   * waits on review, coral for flagged, jade for growth. `night` turns the
   * whole tile dark — one per row at most, for the figure that leads.
   */
  tone?: StatTileTone;
  /** One line under the value: what it covers, or how it moved. */
  detail?: ReactNode;
  /** Given, the tile becomes a filter tab and this runs when it is chosen. */
  onSelect?: () => void;
  isSelected?: boolean;
  className?: string;
}

const WELL_CLASSES: Record<StatTileTone, string> = {
  iris: 'bg-iris-50 text-iris-600 ring-iris-100',
  lilac: 'bg-lilac-50 text-lilac-600 ring-lilac-100',
  jade: 'bg-jade-50 text-jade-600 ring-jade-100',
  honey: 'bg-honey-50 text-honey-700 ring-honey-100',
  coral: 'bg-coral-50 text-coral-600 ring-coral-100',
  night: 'bg-white/10 text-white ring-white/15',
};

/**
 * One count with its label: the KPI row along the top of a screen. The MVP
 * deals in counts and lists rather than charts, so these carry the overview.
 */
export function StatTile({
  label,
  value,
  icon: Icon,
  tone = 'iris',
  detail,
  onSelect,
  isSelected = false,
  className,
}: StatTileProps) {
  const isNight = tone === 'night';
  const body = (
    <>
      <span
        aria-hidden="true"
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset sm:size-10',
          WELL_CLASSES[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <span className="mt-3 block sm:mt-4">
        <span
          className={cn(
            'block text-sm font-semibold',
            isNight ? 'text-white/70' : 'text-ink-muted',
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            'mt-1 block text-2xl font-black leading-none tracking-tight sm:text-3xl',
            isNight ? 'text-jade-300' : 'text-ink',
          )}
        >
          {value}
        </span>
        {detail ? (
          <span
            className={cn('mt-2 block text-xs font-medium', isNight ? 'text-white/60' : 'text-ink-faint')}
          >
            {detail}
          </span>
        ) : null}
      </span>
    </>
  );

  const surface = cn(
    'relative flex flex-col items-start rounded-2xl border p-4 text-left sm:p-5',
    isNight
      ? 'border-night-700 bg-insight text-white shadow-raised'
      : 'border-line/70 bg-white/85 shadow-card',
    className,
  );

  if (!onSelect) return <div className={surface}>{body}</div>;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      onClick={onSelect}
      className={cn(
        surface,
        'transition-[border-color,box-shadow,transform] duration-150 active:translate-y-px',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
        isSelected
          ? 'border-iris-300 shadow-[0_0_0_3px_rgba(85,88,230,0.16),0_16px_32px_-20px_rgba(46,42,130,0.55)]'
          : 'hover:border-iris-200',
      )}
    >
      {body}
      {isSelected ? (
        <span
          aria-hidden="true"
          className="absolute right-4 top-4 size-2 rounded-full bg-iris-500 shadow-[0_0_0_4px_rgba(85,88,230,0.16)]"
        />
      ) : null}
    </button>
  );
}
