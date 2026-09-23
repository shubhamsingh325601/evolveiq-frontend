import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './class-names';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, hasError = false, children, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full appearance-none rounded border bg-surface px-3 text-sm text-ink',
        'bg-[length:14px] bg-[right_0.75rem_center] bg-no-repeat pr-9',
        "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%235A6B74' stroke-width='1.5'><path d='M4 6l4 4 4-4'/></svg>\")]",
        'focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-teal-500',
        hasError ? 'border-raspberry-500' : 'border-line',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
