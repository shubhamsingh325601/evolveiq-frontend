import { useState, type FormEvent } from 'react';
import { useSetUserPassword, type User } from '@evolveiq/api-client';
import { Button, FormField, Input, Modal } from '@evolveiq/ui';
import { saveErrorMessage } from './account-fields';

export interface SetPasswordDialogProps {
  /** Whose password (adult) or PIN (student) to set; null closes the dialog. */
  person: Pick<User, 'id' | 'fullName' | 'role'> | null;
  onClose: () => void;
}

/**
 * For someone who forgot their password or PIN (21 Nov 2026). Students have no
 * email, so this — or their parent — is how a forgotten PIN is replaced. Adults
 * can also reset their own by email, but not everyone can reach their inbox.
 * Nothing is emailed: whoever sets the new one tells the person. They are
 * signed out everywhere, and a login lockout is cleared.
 */
export function SetPasswordDialog({ person, onClose }: SetPasswordDialogProps) {
  const setPassword = useSetUserPassword();
  const [value, setValue] = useState('');
  const [problem, setProblem] = useState<string>();
  const [isDone, setIsDone] = useState(false);
  const isStudent = person?.role === 'student';
  const what = isStudent ? 'PIN' : 'password';

  const close = () => {
    setValue('');
    setProblem(undefined);
    setIsDone(false);
    onClose();
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!person) return;
    const isValid = isStudent ? /^[0-9]{6}$/.test(value) : value.length >= 10 && value.length <= 128;
    if (!isValid) {
      setProblem(isStudent ? 'A PIN is exactly 6 digits.' : 'Use 10 to 128 characters.');
      return;
    }
    setProblem(undefined);
    try {
      await setPassword.mutateAsync({ userId: person.id, secret: isStudent ? { pin: value } : { password: value } });
      setIsDone(true);
    } catch (caught) {
      setProblem(saveErrorMessage(caught, `We could not set a new ${what} for ${person.fullName}. Try again.`));
    }
  };

  const title = !person ? `New ${what}` : isDone ? `New ${what} set` : `New ${what} for ${person.fullName}`;
  const description = isDone
    ? undefined
    : isStudent
      ? 'For a student who forgot their PIN. Tell them the new one.'
      : 'For someone who forgot their password. Tell them the new one: they can change it from their account menu.';

  return (
    <Modal
      isOpen={person !== null}
      onClose={close}
      title={title}
      description={description}
      footer={
        isDone ? (
          <Button onClick={close}>Done</Button>
        ) : (
          <>
            <Button variant="quiet" onClick={close}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} isLoading={setPassword.isPending}>
              Set {what}
            </Button>
          </>
        )
      }
    >
      {isDone ? (
        <p className="text-sm text-ink-muted">
          {person?.fullName} can sign in with the new {what} now. They have been signed out everywhere else.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-5" noValidate>
          <FormField
            label={isStudent ? 'New PIN' : 'New password'}
            hint={isStudent ? 'Exactly 6 digits.' : 'At least 10 characters.'}
            error={problem}
          >
            {/* Shown as typed: the admin reads it out to the person. */}
            <Input
              autoComplete="off"
              spellCheck={false}
              inputMode={isStudent ? 'numeric' : 'text'}
              maxLength={isStudent ? 6 : 128}
              value={value}
              onChange={(event) =>
                setValue(isStudent ? event.target.value.replace(/\D/g, '').slice(0, 6) : event.target.value)
              }
            />
          </FormField>
        </form>
      )}
    </Modal>
  );
}
