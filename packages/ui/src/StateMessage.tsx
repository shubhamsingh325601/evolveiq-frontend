import { cn } from './class-names';

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = 'Loading', className }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn('flex items-center gap-3 px-1 py-8 text-sm text-ink-muted', className)}
    >
      <span className="size-4 animate-spin rounded-full border-2 border-line-strong border-t-teal-500" />
      {label}
    </div>
  );
}

export interface ErrorStateProps {
  /** What went wrong, in plain words. */
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'That did not load',
  description = 'Check your connection and try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-2 rounded-md border border-raspberry-100 bg-raspberry-50 px-5 py-4',
        className,
      )}
    >
      <p className="text-sm font-medium text-raspberry-700">{title}</p>
      <p className="max-w-prose text-sm text-ink-muted">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded text-sm font-medium text-raspberry-700 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-raspberry-500"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
