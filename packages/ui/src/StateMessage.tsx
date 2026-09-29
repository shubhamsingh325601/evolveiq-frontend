import { cn } from './class-names';
import { CircleAlert } from './icons';

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
      <span className="size-5 animate-spin rounded-full border-2 border-iris-100 border-t-iris-500" />
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
        'flex items-start gap-3.5 rounded-2xl border border-coral-100 bg-coral-50/90 px-5 py-4',
        className,
      )}
    >
      <CircleAlert className="mt-0.5 size-5 shrink-0 text-coral-600" />
      <div className="flex flex-col items-start gap-1">
        <p className="text-sm font-medium text-coral-700">{title}</p>
        <p className="max-w-prose text-sm text-ink-muted">{description}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1.5 rounded text-sm font-medium text-coral-700 underline decoration-coral-300 underline-offset-4 hover:decoration-coral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-500"
          >
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}
