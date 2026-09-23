import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './class-names';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...props },
  ref,
) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-ink', className)}>
      <input
        ref={ref}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded-sm border-line text-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});
