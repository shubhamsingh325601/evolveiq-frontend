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

/** Selectable options with a visible chosen state, used for radios and MCQs. */
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
        'grid gap-2',
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
              'flex cursor-pointer items-start gap-3 border transition-colors',
              isPlayful ? 'rounded-lg px-4 py-4' : 'rounded px-3.5 py-3',
              isSelected
                ? 'border-teal-500 bg-teal-50'
                : 'border-line bg-surface hover:border-line-strong',
              'focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-teal-500',
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={option.value}
              checked={isSelected}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-4 shrink-0 border-line text-teal-500 focus:outline-none"
            />
            <span className="min-w-0">
              <span
                className={cn(
                  'block text-ink',
                  isPlayful ? 'text-base font-medium' : 'text-sm',
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
