import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from './class-names';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  /**
   * `chip` draws the whole option as a selectable tile, for a grid of choices
   * such as the development areas a psychologist tags.
   */
  variant?: 'plain' | 'chip';
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, variant = 'plain', disabled, ...props },
  ref,
) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 text-sm text-ink',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        variant === 'chip' && [
          'rounded-xl border border-line bg-white/80 px-3.5 py-3 transition-colors',
          !disabled && 'hover:border-iris-200',
          'has-[:checked]:border-iris-300 has-[:checked]:bg-iris-50/80 has-[:checked]:text-iris-800',
        ],
        className,
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        disabled={disabled}
        className="mt-px size-[18px] shrink-0 cursor-[inherit] rounded accent-iris-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});
