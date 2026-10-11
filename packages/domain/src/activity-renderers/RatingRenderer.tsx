import { cn } from '@evolveiq/ui';
import type { ActivityRendererProps } from './renderer-types';

const SCALE = [1, 2, 3, 4, 5] as const;

/** A whole number from 1 to 5; the prompt says what the two ends mean. */
export function RatingRenderer({ content, answer, onAnswer }: ActivityRendererProps<'rating'>) {
  return (
    <div role="radiogroup" aria-label={content.prompt} className="flex gap-2 sm:gap-3">
      {SCALE.map((point) => {
        const isSelected = answer?.rating === point;
        return (
          <button
            key={point}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`${point} out of 5`}
            onClick={() => onAnswer({ type: 'rating', rating: point })}
            className={cn(
              'h-16 flex-1 rounded-2xl text-2xl font-black tabular-nums transition-[background-color,box-shadow,color,transform] duration-150',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
              isSelected
                ? 'scale-105 bg-iris-500 text-white shadow-glow'
                : 'bg-white/80 text-ink ring-1 ring-inset ring-line hover:bg-white hover:ring-iris-200',
            )}
          >
            {point}
          </button>
        );
      })}
    </div>
  );
}
