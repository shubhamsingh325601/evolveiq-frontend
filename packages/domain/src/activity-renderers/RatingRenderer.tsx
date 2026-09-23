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
      <div role="radiogroup" aria-label={step.prompt} className="flex gap-2">
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
                'h-14 flex-1 rounded-lg border-2 text-xl font-semibold tabular-nums transition-colors',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
                isSelected
                  ? 'border-teal-500 bg-teal-500 text-ink-inverse'
                  : 'border-line bg-surface text-ink hover:border-line-strong',
              )}
            >
              {point}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-sm text-ink-muted">
        <span>{step.lowLabel}</span>
        <span>{step.highLabel}</span>
      </div>
    </div>
  );
}
