import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './class-names';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, hasError = false, rows = 5, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={hasError || undefined}
      className={cn(
        'w-full rounded border bg-surface px-3 py-2 text-base text-ink placeholder:text-ink-faint',
        'focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-teal-500',
        hasError ? 'border-raspberry-500' : 'border-line',
        className,
      )}
      {...props}
    />
  );
});
