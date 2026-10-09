import type { HolisticIndex } from '@evolveiq/api-client';

export interface EhiMeterProps {
  index: HolisticIndex | undefined;
}

/**
 * A child's EvolvIQ Holistic Index in a table cell: a short meter on a lighter
 * step of the same hue, with the number printed beside it so the bar is never
 * the only way to read it.
 */
export function EhiMeter({ index }: EhiMeterProps) {
  if (!index) return <span className="text-ink-faint">Not yet</span>;
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden="true" className="hidden h-2 w-24 overflow-hidden rounded-full bg-iris-100 sm:block">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-iris-400 to-iris-600"
          style={{ width: `${Math.min(100, Math.max(0, index.score))}%` }}
        />
      </span>
      <span className="font-black tabular-nums text-ink">{index.score}</span>
    </span>
  );
}
