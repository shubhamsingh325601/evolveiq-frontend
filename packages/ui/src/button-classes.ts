import { cn } from './class-names';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'quiet'
  | 'danger'
  | 'danger-quiet'
  | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-iris-500 text-white shadow-glow hover:bg-iris-600 active:bg-iris-700',
  secondary:
    'border border-line bg-white/80 text-ink hover:border-iris-200 hover:bg-white active:bg-iris-50',
  quiet: 'text-iris-600 hover:bg-iris-50 active:bg-iris-100',
  danger: 'bg-coral-600 text-white hover:bg-coral-700',
  // A destructive action repeated down a list, such as "Remove" on each row.
  // It only turns coral under the pointer, so a column of them stays quiet.
  'danger-quiet': 'text-ink-muted hover:bg-coral-50 hover:text-coral-700 active:bg-coral-100',
  // For use on a hero panel or any other iris-to-lilac surface.
  inverse: 'bg-white text-iris-700 shadow-raised hover:bg-iris-50',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Student-facing surfaces use a rounder, larger target. */
  isPlayful?: boolean;
  className?: string;
}

/**
 * The button's look, without the button. Lets a react-router `<Link>` match a
 * `<Button>` exactly rather than nesting an anchor inside a button element.
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  isPlayful = false,
  className,
}: ButtonClassOptions = {}): string {
  return cn(
    'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold',
    'transition-[background-color,border-color,color,box-shadow,transform] duration-150 enabled:active:translate-y-px',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
    '[&_svg]:size-4 [&_svg]:shrink-0',
    isPlayful ? 'rounded-xl' : 'rounded-lg',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    isPlayful && size === 'lg' && 'h-14 px-7 text-lg [&_svg]:size-5',
    className,
  );
}
