import type { RatingStep } from '@evolveiq/api-client';
import { cn } from '@evolveiq/ui';
import type { ActivityStepRendererProps } from './renderer-types';

const SCALE = [1, 2, 3, 4, 5] as const;

export function RatingRenderer({
  step,
  value,
  onChange,
}: ActivityStepRendererProps<RatingStep>) {
  return (
    <div>
      <div role="radiogroup" aria-label={step.prompt} className="flex gap-2 sm:gap-3">
        {SCALE.map((point) => {
          const isSelected = value === point;
          return (
            <button
              key={point}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${point} out of 5`}
              onClick={() => onChange(point)}
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
      <div className="mt-3 flex justify-between text-sm font-medium text-ink-muted">
        <span>{step.lowLabel}</span>
        <span>{step.highLabel}</span>
      </div>
    </div>
  );
}
