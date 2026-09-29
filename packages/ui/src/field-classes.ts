import { cn } from './class-names';

/** Shared by every text-like control so they focus and fail the same way. */
export function fieldClasses({ hasError = false }: { hasError?: boolean } = {}): string {
  return cn(
    'w-full rounded-lg border bg-white/90 text-ink placeholder:text-ink-faint',
    'transition-[border-color,box-shadow] duration-150',
    'focus:border-iris-500 focus:outline-none focus:ring-4 focus:ring-iris-500/15',
    'disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-faint',
    hasError
      ? 'border-coral-500 focus:border-coral-500 focus:ring-coral-500/15'
      : 'border-line hover:border-line-strong',
  );
}
