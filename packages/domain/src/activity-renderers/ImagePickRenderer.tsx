import type { ImagePickStep } from '@evolveiq/api-client';
import { cn } from '@evolveiq/ui';
import type { ActivityStepRendererProps } from './renderer-types';

export function ImagePickRenderer({
  step,
  value,
  onChange,
}: ActivityStepRendererProps<ImagePickStep>) {
  return (
    <div role="radiogroup" aria-label={step.prompt} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {step.options.map((option) => {
        const isSelected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
              isSelected
                ? 'border-teal-500 bg-teal-50'
                : 'border-line bg-surface hover:border-line-strong',
            )}
          >
            <img
              src={option.imageUrl}
              alt=""
              className="aspect-[4/3] w-full rounded object-cover"
            />
            <span className="text-base font-medium text-ink">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
