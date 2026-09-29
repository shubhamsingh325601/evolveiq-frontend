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

/**
 * Filter switcher used by the review queue, the library and the records
 * screens. A single scrolling row of chips on a phone; wraps from a tablet up.
 */
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
      className={cn(
        '-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-1 sm:flex-wrap sm:overflow-visible',
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
        className,
      )}
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
              'inline-flex h-9 shrink-0 items-center gap-2 rounded-full pl-4 text-sm font-medium transition-[background-color,color,box-shadow] duration-150',
              option.count !== undefined ? 'pr-1.5' : 'pr-4',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
              isSelected
                ? 'bg-iris-500 text-white shadow-glow'
                : 'bg-white/75 text-ink-muted ring-1 ring-inset ring-line hover:bg-white hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  'min-w-[1.625rem] rounded-full px-1.5 py-0.5 text-center text-xs tabular-nums',
                  isSelected ? 'bg-white/20 text-white' : 'bg-iris-50 text-iris-700',
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
