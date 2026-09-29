import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from './class-names';
import { X } from './icons';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * A frosted dialog. On a phone it rises as a sheet from the bottom edge, where
 * a thumb already is; from a tablet up it sits in the middle of the page.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 size-full cursor-default bg-night/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative max-h-[92dvh] w-full animate-rise overflow-y-auto rounded-t-3xl border border-white/70 bg-white/95 shadow-overlay backdrop-blur-2xl focus:outline-none sm:max-w-lg sm:rounded-3xl',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-iris-50 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="px-6 py-6">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line-soft bg-surface-sunk/70 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
