import type { ImagePickStep } from '@evolveiq/api-client';
import { Check, cn } from '@evolveiq/ui';
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
              'relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-white/80 p-3 transition-[border-color,background-color,box-shadow] duration-150',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
              isSelected
                ? 'border-iris-500 bg-iris-50 shadow-[0_0_0_4px_rgba(85,88,230,0.14)]'
                : 'border-line hover:border-iris-200 hover:bg-white',
            )}
          >
            <img src={option.imageUrl} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
            <span className="text-base font-medium text-ink">{option.label}</span>
            {isSelected ? (
              <span className="absolute right-2 top-2 flex size-7 animate-streak-mark items-center justify-center rounded-full bg-iris-500 text-white shadow-glow">
                <Check className="size-4" strokeWidth={3} />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
