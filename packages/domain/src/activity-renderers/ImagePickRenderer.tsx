import { Check, cn } from '@evolveiq/ui';
import type { ActivityRendererProps } from './renderer-types';

export function ImagePickRenderer({ content, answer, onAnswer }: ActivityRendererProps<'image_pick'>) {
  return (
    <div role="radiogroup" aria-label={content.prompt} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {content.options.map((option, index) => {
        const isSelected = answer?.optionId === option.id;
        const label = option.label ?? `Picture ${index + 1}`;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={label}
            onClick={() => onAnswer({ type: 'image_pick', optionId: option.id })}
            className={cn(
              'relative flex flex-col items-center gap-3 rounded-2xl border-2 bg-white/80 p-3 transition-[border-color,background-color,box-shadow] duration-150',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
              isSelected
                ? 'border-iris-500 bg-iris-50 shadow-[0_0_0_4px_rgba(85,88,230,0.14)]'
                : 'border-line hover:border-iris-200 hover:bg-white',
            )}
          >
            <img
              src={option.imageUrl}
              alt=""
              className="aspect-[4/3] w-full rounded-xl bg-surface-sunk object-cover"
            />
            {option.label ? <span className="text-base font-medium text-ink">{option.label}</span> : null}
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
