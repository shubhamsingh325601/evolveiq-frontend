import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './class-names';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(
        'h-10 w-full rounded border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint',
        'focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-teal-500',
        hasError ? 'border-raspberry-500' : 'border-line',
        className,
      )}
      {...props}
    />
  );
});
