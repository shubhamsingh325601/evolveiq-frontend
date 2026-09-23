import { cn } from './class-names';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-teal-500 text-ink-inverse hover:bg-teal-600 active:bg-teal-700',
  secondary:
    'bg-surface text-ink border border-line hover:border-line-strong hover:bg-surface-sunk',
  quiet: 'bg-transparent text-teal-600 hover:bg-teal-50',
  danger: 'bg-raspberry-500 text-white hover:bg-raspberry-700',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export interface ButtonClassOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Student-facing surfaces use the softer radius. */
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
    'inline-flex items-center justify-center gap-2 font-medium transition-colors',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    isPlayful ? 'rounded-lg' : 'rounded',
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  );
}
