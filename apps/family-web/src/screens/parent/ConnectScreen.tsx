import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useFamilyThread,
  useSchoolContacts,
  useSendFamilyMessage,
  type ContactRole,
  type Person,
  type SchoolContact,
} from '@evolveiq/api-client';
import { firstNameOf } from '@evolveiq/domain';
import {
  ArrowLeft,
  Avatar,
  Button,
  Card,
  cn,
  EmptyState,
  ErrorState,
  LoadingState,
  MessageCircle,
  Phone,
  Send,
  Textarea,
} from '@evolveiq/ui';
import { ChildPickerPage } from '../../components/ChildPickerPage';

const ROLE_NAMES: Record<ContactRole, string> = {
  teacher: 'Class teacher',
  psychologist: 'School counsellor',
  school_admin: 'School admin',
};

const ROUND_BUTTON =
  'flex size-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50';

const timeOf = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** A short back-and-forth with one person at the school about one child. */
function Thread({ child, contact, backTo }: { child: Person; contact: SchoolContact; backTo: string }) {
  const thread = useFamilyThread(child.id, contact.id);
  const send = useSendFamilyMessage(child.id);
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (body === '') return;
    send.mutate({ contactId: contact.id, body }, { onSuccess: () => setDraft('') });
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to={backTo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-iris-700">
        <ArrowLeft className="size-4" /> All contacts
      </Link>
      <Card isPlayful className="flex items-center gap-4 p-4">
        <Avatar name={contact.fullName} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-bold text-ink">{contact.fullName}</p>
          <p className="truncate text-sm text-ink-muted">
            {ROLE_NAMES[contact.role]}, about {firstNameOf(child.fullName)}
          </p>
        </div>
      </Card>

      {thread.isLoading ? <LoadingState label="Loading messages" /> : null}
      {thread.isError ? <ErrorState onRetry={() => void thread.refetch()} /> : null}
      {thread.data ? (
        thread.data.messages.length === 0 ? (
          <p className="px-1 text-sm text-ink-muted">No messages yet. Say hello below.</p>
        ) : (
          <ul aria-label={`Messages with ${contact.fullName}`} className="flex flex-col gap-3">
            {thread.data.messages.map((message) => (
              <li key={message.id} className={cn('flex flex-col gap-1', message.fromParent ? 'items-end' : 'items-start')}>
                <p
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm',
                    message.fromParent ? 'bg-iris-600 text-white' : 'bg-iris-50 text-ink',
                  )}
                >
                  {message.body}
                </p>
                <span className="px-1 text-xs text-ink-faint">
                  {message.fromParent ? 'You' : contact.fullName}, {timeOf(message.at)}
                </span>
              </li>
            ))}
          </ul>
        )
      ) : null}

      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="connect-message" className="sr-only">
          Your message to {contact.fullName}
        </label>
        <Textarea
          id="connect-message"
          rows={3}
          maxLength={1000}
          placeholder={`Write to ${contact.fullName}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        {send.isError ? (
          <p role="alert" className="text-sm text-coral-700">
            That did not send. Please try again.
          </p>
        ) : null}
        <Button type="submit" isLoading={send.isPending} disabled={draft.trim() === ''} className="self-end">
          <Send className="size-4" /> Send message
        </Button>
      </form>
    </div>
  );
}

function ContactList({ child, contacts, hrefFor }: { child: Person; contacts: SchoolContact[]; hrefFor: (id: string) => string }) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No school contacts yet"
        description={`Your school adds ${firstNameOf(child.fullName)}'s teachers. Please use the school office until then.`}
      />
    );
  }
  return (
    <>
      <ul className="flex flex-col gap-3">
        {contacts.map((contact) => (
          <li key={contact.id}>
            <Card isPlayful className="flex items-center gap-4 p-4">
              <Avatar name={contact.fullName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{contact.fullName}</p>
                <p className="truncate text-sm text-ink-muted">{ROLE_NAMES[contact.role]}</p>
              </div>
              <button
                type="button"
                disabled
                aria-label={`Call ${contact.fullName}`}
                className={cn(ROUND_BUTTON, 'bg-iris-50 text-iris-600')}
              >
                <Phone className="size-5" />
              </button>
              <Link
                to={hrefFor(contact.id)}
                aria-label={`Message ${contact.fullName}`}
                className={cn(ROUND_BUTTON, 'bg-iris-600 text-white')}
              >
                <MessageCircle className="size-5" />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-xs font-medium text-ink-faint">
        Phone numbers are not shared in the app. For something urgent, please call the school office.
      </p>
    </>
  );
}

function ChildContacts({ child }: { child: Person }) {
  const [params] = useSearchParams();
  const contacts = useSchoolContacts(child.id);

  if (contacts.isLoading) return <LoadingState label="Loading contacts" />;
  if (contacts.isError) return <ErrorState onRetry={() => void contacts.refetch()} />;

  const list = contacts.data ?? [];
  const base = `/parent/connect?child=${child.id}`;
  const chosen = list.find((contact) => contact.id === params.get('with'));
  if (chosen) return <Thread child={child} contact={chosen} backTo={base} />;
  return <ContactList child={child} contacts={list} hrefFor={(id) => `${base}&with=${id}`} />;
}

/** The Connect tab: the people at the school a parent can write to about each child. */
export function ConnectScreen() {
  return (
    <ChildPickerPage
      path="/parent/connect"
      title="Connect"
      subtitle={(child) => `The people at school who look after ${firstNameOf(child.fullName)}.`}
    >
      {(child) => <ChildContacts child={child} />}
    </ChildPickerPage>
  );
}
