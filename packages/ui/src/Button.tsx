import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { buttonClasses, type ButtonSize, type ButtonVariant } from './button-classes';
import type { IconComponent } from './icons';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  /** Student-facing surfaces use a rounder, larger target. */
  isPlayful?: boolean;
  /** Drawn before the label. Replaced by the spinner while loading. */
  icon?: IconComponent;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isPlayful = false,
    icon: Icon,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={buttonClasses({
        variant,
        size,
        isPlayful,
        ...(className ? { className } : {}),
      })}
      {...props}
    >
      {isLoading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : Icon ? (
        <Icon />
      ) : null}
      {children}
    </button>
  );
});
