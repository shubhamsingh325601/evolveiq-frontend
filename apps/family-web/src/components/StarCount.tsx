import { Star } from '@evolveiq/ui';

export interface StarCountProps {
  count: number;
}

/** A student's stars as a gold star and a count, beside their streak flame. */
export function StarCount({ count }: StarCountProps) {
  return (
    <p className="flex shrink-0 flex-col items-center rounded-2xl border border-star-200 bg-star-50 px-3 py-1.5 shadow-card">
      <Star aria-hidden="true" className="size-5 fill-star-400 text-star-500" />
      <span className="text-xs font-black tabular-nums text-star-800">
        {count}
        <span className="sr-only"> {count === 1 ? 'star' : 'stars'}</span>
      </span>
    </p>
  );
}
