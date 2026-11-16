import { useState, type FormEvent } from 'react';
import type { NewSupportTicket } from '@evolveiq/api-client';
import { Button, FormField, Input, Textarea } from '@evolveiq/ui';

export interface SupportTicketFormProps {
  onSubmit: (ticket: NewSupportTicket) => Promise<unknown> | void;
  onCancel?: () => void;
  isSaving?: boolean;
  error?: string | undefined;
  submitLabel?: string;
}

/**
 * Raising an IT Help Desk ticket — a gap found against the client's UI
 * prototype (16 Nov 2026), not yet a confirmed client request. One shared
 * form: a Teacher raising their own, or a School Admin from the Help Desk
 * screen. A subject and, optionally, a few more words about the problem;
 * the ticket always starts `open` and belongs to the caller's own school.
 */
export function SupportTicketForm({ onSubmit, onCancel, isSaving = false, error, submitLabel = 'Send' }: SupportTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [problem, setProblem] = useState<string>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (subject.trim() === '') {
      setProblem('Say what the problem is');
      return;
    }
    setProblem(undefined);
    void onSubmit({ subject: subject.trim(), ...(body.trim() ? { body: body.trim() } : {}) });
  };

  return (
    <form onSubmit={submit} aria-label="Raise a ticket" className="flex flex-col gap-5" noValidate>
      <FormField label="What's the problem" {...(problem ? { error: problem } : {})}>
        <Input maxLength={120} value={subject} placeholder="e.g. Projector in 4B won’t turn on" onChange={(event) => setSubject(event.target.value)} />
      </FormField>
      <FormField label="More detail" hint="Anything that helps the office sort it out." isOptional>
        <Textarea rows={4} maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} />
      </FormField>
      {error ? (
        <p role="alert" className="text-sm font-semibold text-coral-700">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" isLoading={isSaving}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="quiet" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
