import { useState, type FormEvent } from 'react';
import { isApiError } from '@evolveiq/api-client';
import { Button, CircleAlert, FormField, Input, Modal } from '@evolveiq/ui';

const MIN_PASSWORD_LENGTH = 10;

export interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Changes the signed-in person's password (`useAuth().changePassword`). */
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

interface Problems {
  current?: string;
  next?: string;
  confirm?: string;
  form?: string;
}

/**
 * An adult changes their own password from the account menu. This device stays
 * signed in; every other device is signed out (the server ends those sessions).
 */
export function ChangePasswordDialog({ isOpen, onClose, onChangePassword }: ChangePasswordDialogProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [problems, setProblems] = useState<Problems>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const close = () => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setProblems({});
    setIsDone(false);
    onClose();
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const found: Problems = {};
    if (!current) found.current = 'Enter the password you use now.';
    if (next.length < MIN_PASSWORD_LENGTH) found.next = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    else if (next.length > 128) found.next = 'Use 128 characters or fewer.';
    else if (confirm !== next) found.confirm = 'The two passwords are not the same.';
    setProblems(found);
    if (Object.keys(found).length > 0) return;

    setIsSaving(true);
    try {
      await onChangePassword(current, next);
      setIsDone(true);
    } catch (caught) {
      if (isApiError(caught) && caught.code === 'INVALID_CURRENT_PASSWORD') {
        setProblems({ current: 'That is not your current password. After several wrong tries, wait 15 minutes.' });
      } else if (isApiError(caught) && caught.code === 'VALIDATION_ERROR') {
        setProblems({ next: `Use ${MIN_PASSWORD_LENGTH} to 128 characters.` });
      } else {
        setProblems({
          form: isApiError(caught)
            ? 'Something went wrong on our side. Try again in a moment.'
            : 'We could not reach EvolvIQ. Check your connection and try again.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={isDone ? 'Password changed' : 'Change password'}
      description={isDone ? undefined : 'You stay signed in here. Every other device is signed out.'}
      footer={
        isDone ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} isLoading={isSaving}>
              Change password
            </Button>
          </>
        )
      }
    >
      {isDone ? (
        <p className="text-sm text-ink-muted">
          Use your new password next time you sign in. Any other phone or computer signed in to this account has been
          signed out.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5" noValidate>
          <FormField label="Current password" error={problems.current}>
            <Input type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} />
          </FormField>
          <FormField label="New password" hint={`At least ${MIN_PASSWORD_LENGTH} characters.`} error={problems.next}>
            <Input type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} />
          </FormField>
          <FormField label="New password again" error={problems.confirm}>
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </FormField>
          {problems.form ? (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-coral-700">
              <CircleAlert className="mt-0.5 size-4 shrink-0" />
              <span>{problems.form}</span>
            </p>
          ) : null}
        </form>
      )}
    </Modal>
  );
}
