import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from './class-names';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** The only surface in the system allowed to lift off the page. */
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 size-full cursor-default"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative max-h-[90dvh] w-full overflow-y-auto rounded-t-md bg-surface shadow-overlay sm:max-w-lg sm:rounded-md',
          className,
        )}
      >
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? (
          <div className="flex justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
