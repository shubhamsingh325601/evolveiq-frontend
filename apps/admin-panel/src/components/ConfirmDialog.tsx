import type { ReactNode } from 'react';
import { Button, CircleAlert, Modal } from '@evolveiq/ui';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  isWorking?: boolean;
  error?: string | undefined;
  /** Offered beside an error, such as "Switch off instead". */
  alternative?: ReactNode;
}

/** "Are you sure?" for something that cannot be undone, with the reason when it could not be done. */
export function ConfirmDialog({ isOpen, title, description, confirmLabel, onConfirm, onClose, isWorking = false, error, alternative }: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {error ? 'Close' : 'Cancel'}
          </Button>
          {error ? alternative : (
            <Button variant="danger" isLoading={isWorking} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          )}
        </>
      }
    >
      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        <p className="text-sm font-medium text-ink-muted">This cannot be undone.</p>
      )}
    </Modal>
  );
}
