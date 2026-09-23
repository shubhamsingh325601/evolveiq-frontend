import { cn } from './class-names';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  /** Shown after the label, e.g. how many rows match this filter. */
  count?: number;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

/** Filter switcher used by the review queue and the records screens. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('-mx-1 flex flex-wrap items-center gap-1 overflow-x-auto px-1', className)}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded border px-3 py-1.5 text-sm transition-colors',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
              isSelected
                ? 'border-teal-500 bg-teal-500 text-ink-inverse'
                : 'border-line bg-surface text-ink-muted hover:border-line-strong hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'tabular-nums',
                  isSelected ? 'text-teal-100' : 'text-ink-faint',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
