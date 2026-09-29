import { useId } from 'react';
import { cn } from './class-names';

export interface RadioCardOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

export interface RadioCardGroupProps<T extends string> {
  name?: string;
  options: RadioCardOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  /** Student-facing surfaces get a larger target and softer radius. */
  isPlayful?: boolean;
  columns?: 1 | 2 | 3;
  className?: string;
}

/**
 * Selectable options with a visible chosen state, used for radios and MCQs.
 * The native radio stays in the DOM for keyboard and screen-reader use; the
 * drawn dot beside it is the visible control.
 */
export function RadioCardGroup<T extends string>({
  name,
  options,
  value,
  onChange,
  isPlayful = false,
  columns = 1,
  className,
}: RadioCardGroupProps<T>) {
  const generatedName = useId();
  const groupName = name ?? generatedName;

  return (
    <div
      className={cn(
        'grid gap-2.5',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-3',
        className,
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <label
            key={option.value}
            className={cn(
              'flex cursor-pointer items-center gap-3.5 border transition-[border-color,background-color,box-shadow] duration-150',
              isPlayful ? 'rounded-2xl px-5 py-4' : 'rounded-xl px-4 py-3',
              isSelected
                ? 'border-iris-400 bg-iris-50/90 shadow-[0_0_0_3px_rgba(85,88,230,0.12)]'
                : 'border-line bg-white/80 hover:border-iris-200 hover:bg-white',
              'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-iris-500',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className={cn(
                'flex shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                isPlayful ? 'size-6' : 'size-5',
                isSelected ? 'border-iris-500 bg-iris-500' : 'border-line-strong bg-white',
              )}
            >
              <span
                className={cn(
                  'rounded-full bg-white transition-transform',
                  isPlayful ? 'size-2.5' : 'size-2',
                  isSelected ? 'scale-100' : 'scale-0',
                )}
              />
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  'block',
                  isSelected ? 'text-iris-900' : 'text-ink',
                  isPlayful ? 'text-lg font-medium' : 'text-sm',
                )}
              >
                {option.label}
              </span>
              {option.description ? (
                <span className="mt-0.5 block text-sm text-ink-muted">{option.description}</span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
