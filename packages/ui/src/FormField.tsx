import { useId, type ReactElement, type ReactNode, cloneElement } from 'react';
import { cn } from './class-names';
import { CircleAlert } from './icons';

export interface FormFieldProps {
  label: string;
  /** Shown under the label when the question needs a word of explanation. */
  hint?: string;
  error?: string;
  isOptional?: boolean;
  className?: string;
  children: ReactElement<{ id?: string; 'aria-describedby'?: string; hasError?: boolean }>;
}

function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1.5 text-sm text-coral-700">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
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
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-col gap-1">
        <label htmlFor={fieldId} className="text-sm font-semibold text-ink">
          {label}
          {isOptional ? (
            <span className="ml-2 font-normal text-ink-faint">optional</span>
          ) : null}
        </label>
        {hint ? (
          <p id={hintId} className="text-sm text-ink-muted">
            {hint}
          </p>
        ) : null}
      </div>
      {cloneElement(children, {
        id: fieldId,
        'aria-describedby': describedBy,
        hasError: Boolean(error),
      })}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
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
    <fieldset className={cn('flex flex-col gap-1', className)}>
      <legend className="text-sm font-semibold text-ink">{legend}</legend>
      {hint ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      <div className="mt-2">{children}</div>
      {error ? <FieldError>{error}</FieldError> : null}
    </fieldset>
  );
}
