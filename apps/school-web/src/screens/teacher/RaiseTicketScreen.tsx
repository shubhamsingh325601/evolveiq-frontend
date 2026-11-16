import { useState } from 'react';
import { isApiError, useCreateSupportTicket, type NewSupportTicket } from '@evolveiq/api-client';
import { SupportTicketForm } from '@evolveiq/domain';
import { Card, PageHeader } from '@evolveiq/ui';

/**
 * A Teacher raising an IT Help Desk ticket — a gap found against the
 * client's UI prototype (16 Nov 2026), not yet a confirmed client request;
 * built so the project is ready to demo. The same form a School Admin uses.
 * No list here: a teacher sees only what they raised, and there isn't much
 * to show beyond "sent".
 */
export function RaiseTicketScreen() {
  const create = useCreateSupportTicket();
  const [formKey, setFormKey] = useState(0);
  const [sentSubject, setSentSubject] = useState<string>();
  const error = create.isError ? (isApiError(create.error) ? create.error.message : 'We could not send that. Try again.') : undefined;

  const handleSubmit = async (ticket: NewSupportTicket) => {
    setSentSubject(undefined);
    try {
      await create.mutateAsync(ticket);
      setSentSubject(ticket.subject);
      setFormKey((key) => key + 1);
    } catch {
      // Shown in the form.
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Raise a ticket" subtitle="Something not working? Tell the school office and they’ll follow up." />

      <Card isPlayful className="max-w-xl p-6 sm:p-8">
        {sentSubject ? (
          <p role="status" className="mb-5 rounded-xl bg-jade-50 px-3.5 py-3 text-sm font-semibold text-jade-700">
            Sent: “{sentSubject}”. The school office will follow up.
          </p>
        ) : null}
        <SupportTicketForm key={formKey} isSaving={create.isPending} {...(error ? { error } : {})} submitLabel="Send" onSubmit={handleSubmit} />
      </Card>
    </div>
  );
}
