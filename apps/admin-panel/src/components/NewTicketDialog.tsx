import { isApiError, useCreateSupportTicket } from '@evolveiq/api-client';
import { SupportTicketForm } from '@evolveiq/domain';
import { Modal } from '@evolveiq/ui';

export interface NewTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * A School Admin raising their own IT Help Desk ticket, from the Help Desk
 * screen — the same form a Teacher uses in the school app.
 */
export function NewTicketDialog({ isOpen, onClose }: NewTicketDialogProps) {
  const create = useCreateSupportTicket();
  const error = create.isError ? (isApiError(create.error) ? create.error.message : 'We could not send that. Try again.') : undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        create.reset();
        onClose();
      }}
      title="Raise a ticket"
      description="What's wrong, in a few words. The school office will follow up."
    >
      <SupportTicketForm
        isSaving={create.isPending}
        error={error}
        submitLabel="Send"
        onCancel={onClose}
        onSubmit={async (ticket) => {
          try {
            await create.mutateAsync(ticket);
            onClose();
          } catch {
            // Shown in the form.
          }
        }}
      />
    </Modal>
  );
}
