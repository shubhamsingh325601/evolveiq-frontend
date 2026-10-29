import { useState } from 'react';
import { isApiError, useDeactivateUser, useRemoveUser, type User } from '@evolveiq/api-client';
import { Button } from '@evolveiq/ui';
import { saveErrorMessage } from './account-fields';
import { ConfirmDialog } from './ConfirmDialog';

export interface RemoveAccountDialogProps {
  /** The account to remove; null closes the dialog. */
  person: User | null;
  onClose: () => void;
}

/**
 * Removing an account (client feedback, 29 Oct 2026: "modify data, add, remove").
 * Only an account with no records can go — one added by mistake, or never used.
 * One with records is kept, and the dialog offers to switch it off instead, so
 * the school keeps what happened.
 */
export function RemoveAccountDialog({ person, onClose }: RemoveAccountDialogProps) {
  const remove = useRemoveUser();
  const deactivate = useDeactivateUser();
  const [error, setError] = useState<string>();
  const [hasRecords, setHasRecords] = useState(false);

  const close = () => {
    setError(undefined);
    setHasRecords(false);
    onClose();
  };

  const confirm = async () => {
    if (!person) return;
    try {
      await remove.mutateAsync(person.id);
      close();
    } catch (caught) {
      const isKept = isApiError(caught) && caught.code === 'HAS_RECORDS';
      setHasRecords(isKept);
      setError(
        isKept
          ? `${person.fullName} has records at school, so the account cannot be removed. ${person.isActive ? 'Switch it off instead: they can no longer sign in, and the records are kept.' : 'It is already switched off, so they cannot sign in.'}`
          : saveErrorMessage(caught, `We could not remove ${person.fullName}. Try again.`),
      );
    }
  };

  const switchOff = async () => {
    if (!person) return;
    try {
      await deactivate.mutateAsync(person.id);
      close();
    } catch (caught) {
      setError(saveErrorMessage(caught, `We could not switch off ${person.fullName}’s account. Try again.`));
    }
  };

  return (
    <ConfirmDialog
      isOpen={person !== null}
      title={person ? `Remove ${person.fullName}?` : 'Remove'}
      description="Their account, class place and family link go. Only an account with no records can be removed."
      confirmLabel="Remove"
      onConfirm={() => void confirm()}
      onClose={close}
      isWorking={remove.isPending}
      error={error}
      alternative={
        hasRecords && person?.isActive ? (
          <Button variant="danger" isLoading={deactivate.isPending} onClick={() => void switchOff()}>
            Switch off instead
          </Button>
        ) : null
      }
    />
  );
}
