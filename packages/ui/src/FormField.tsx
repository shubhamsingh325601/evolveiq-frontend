import { useId, type ReactElement, type ReactNode, cloneElement } from 'react';
import { cn } from './class-names';

export interface FormFieldProps {
  label: string;
  /** Shown under the label when the question needs a word of explanation. */
  hint?: string;
  error?: string;
  isOptional?: boolean;
  className?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; hasError?: boolean }>;
}

/** Label, hint and error wiring for a single control. */
export function FormField({
  label,
  hint,
  error,
  isOptional = false,
  className,
  children,
}: FormFieldProps) {
  const fieldId = useId();
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={fieldId} className="text-sm font-medium text-ink">
        {label}
        {isOptional ? <span className="ml-1.5 font-normal text-ink-faint">optional</span> : null}
      </label>
      {hint ? (
        <p id={hintId} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy,
        hasError: Boolean(error),
      })}
      {error ? (
        <p id={errorId} className="text-sm text-raspberry-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export interface FieldsetProps {
  legend: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

/** Same shape as FormField, for groups of radios or checkboxes. */
export function Fieldset({ legend, hint, error, children, className }: FieldsetProps) {
  return (
    <fieldset className={cn('flex flex-col gap-1.5', className)}>
      <legend className="text-sm font-medium text-ink">{legend}</legend>
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      <div className="mt-1">{children}</div>
      {error ? <p className="text-sm text-raspberry-700">{error}</p> : null}
    </fieldset>
  );
}
