import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from './class-names';
import { fieldClasses } from './field-classes';

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
        fieldClasses({ hasError }),
        'h-11 cursor-pointer appearance-none px-3.5 pr-10 text-sm',
        'bg-[length:16px] bg-[right_0.875rem_center] bg-no-repeat',
        "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%234E5074' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M4 6l4 4 4-4'/></svg>\")]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});
