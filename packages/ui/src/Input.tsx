import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './class-names';
import { fieldClasses } from './field-classes';
import type { IconComponent } from './icons';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  /** Drawn inside the field on the left, e.g. a search glass. */
  leadingIcon?: IconComponent;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, leadingIcon: LeadingIcon, ...props },
  ref,
) {
  const input = (
    <input
      ref={ref}
      aria-invalid={hasError || undefined}
      className={cn(fieldClasses({ hasError }), 'h-11 px-3.5 text-sm', LeadingIcon && 'pl-10', className)}
      {...props}
    />
  );

  if (!LeadingIcon) return input;

  return (
    <div className="relative">
      <LeadingIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      {input}
    </div>
  );
});
