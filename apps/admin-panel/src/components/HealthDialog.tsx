import { isApiError, useHealthProfile, useSaveHealthProfile, type User } from '@evolveiq/api-client';
import { firstNameOf, HealthProfileForm, possessive } from '@evolveiq/domain';
import { LoadingState, Modal } from '@evolveiq/ui';

export interface HealthDialogProps {
  /** The student; null closes the dialog. */
  student: User | null;
  onClose: () => void;
}

/**
 * The school office records a student's health and care needs — the "manual
 * feed" for what a family told the school on paper (client feedback, 29 Oct
 * 2026). The same form a parent fills in on their Health tab.
 */
export function HealthDialog({ student, onClose }: HealthDialogProps) {
  const health = useHealthProfile(student?.id);
  const save = useSaveHealthProfile(student?.id ?? '');
  const name = student ? firstNameOf(student.fullName) : '';
  const error = save.isError ? (isApiError(save.error) ? save.error.message : 'We could not save that. Try again.') : undefined;

  return (
    <Modal
      isOpen={student !== null}
      onClose={() => {
        save.reset();
        onClose();
      }}
      title={student ? `${possessive(name)} health and care` : 'Health and care'}
      description={`What the school should know. ${possessive(name)} teachers and the counsellor see it; so does their parent, who can change it too.`}
      className="sm:max-w-2xl"
    >
      {health.isLoading || !student ? (
        <LoadingState label="Loading" />
      ) : (
        <HealthProfileForm
          key={`${student.id}:${health.data?.updatedAt ?? 'new'}`}
          profile={health.data}
          name={name}
          isSaving={save.isPending}
          error={error}
          submitLabel="Save"
          onCancel={onClose}
          onSubmit={async (input) => {
            try {
              await save.mutateAsync(input);
              onClose();
            } catch {
              // Shown in the form.
            }
          }}
        />
      )}
    </Modal>
  );
}
