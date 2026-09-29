import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from './class-names';
import { fieldClasses } from './field-classes';

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
      className={cn(fieldClasses({ hasError }), 'px-3.5 py-3 text-base leading-7', className)}
      {...props}
    />
  );
});
