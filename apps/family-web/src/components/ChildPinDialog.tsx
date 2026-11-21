import { useState, type FormEvent } from 'react';
import { isApiError, useSetChildPin } from '@evolveiq/api-client';
import { Button, FormField, Input, Modal } from '@evolveiq/ui';

export interface ChildPinDialogProps {
  /** The child who forgot their PIN; null closes the dialog. */
  child: { id: string; fullName: string } | null;
  onClose: () => void;
}

/**
 * A parent sets a new PIN for their child (21 Nov 2026). Children sign in with
 * a student ID and PIN and have no email, so a forgotten PIN is replaced here
 * or by the school. The child is signed out on every device.
 */
export function ChildPinDialog({ child, onClose }: ChildPinDialogProps) {
  const setPin = useSetChildPin();
  const [pin, setPinValue] = useState('');
  const [problem, setProblem] = useState<string>();
  const [isDone, setIsDone] = useState(false);
  const firstName = child?.fullName.trim().split(/\s+/)[0] ?? '';

  const close = () => {
    setPinValue('');
    setProblem(undefined);
    setIsDone(false);
    onClose();
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!child) return;
    if (!/^[0-9]{6}$/.test(pin)) {
      setProblem('A PIN is exactly 6 digits.');
      return;
    }
    setProblem(undefined);
    try {
      await setPin.mutateAsync({ studentId: child.id, pin });
      setIsDone(true);
    } catch (caught) {
      setProblem(
        isApiError(caught)
          ? 'We could not set the new PIN. Try again in a moment.'
          : 'We could not reach EvolvIQ. Check your connection and try again.',
      );
    }
  };

  return (
    <Modal
      isOpen={child !== null}
      onClose={close}
      title={isDone ? 'New PIN set' : `New PIN for ${firstName}`}
      description={isDone ? undefined : `If ${firstName} forgot their PIN, choose a new one and tell them.`}
      footer={
        isDone ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} isLoading={setPin.isPending}>
              Set PIN
            </Button>
          </>
        )
      }
    >
      {isDone ? (
        <p className="text-sm text-ink-muted">
          {firstName} can sign in with the new PIN now, with the same student ID. They have been signed out on any other
          device.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5" noValidate>
          <FormField label="New PIN" hint="Exactly 6 digits." error={problem}>
            <Input
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(event) => setPinValue(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}
