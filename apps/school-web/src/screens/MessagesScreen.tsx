import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useMessageInbox, useReplyToParent, useStaffThread, type InboxThread } from '@evolveiq/api-client';
import {
  ArrowLeft,
  Avatar,
  Badge,
  Button,
  Card,
  cn,
  EmptyState,
  ErrorState,
  LoadingState,
  MessageCircle,
  PageHeader,
  Send,
  Textarea,
} from '@evolveiq/ui';

const timeOf = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

function Thread({ studentId }: { studentId: string }) {
  const thread = useStaffThread(studentId);
  const reply = useReplyToParent(studentId);
  const [draft, setDraft] = useState('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const body = draft.trim();
    if (body === '') return;
    reply.mutate(body, { onSuccess: () => setDraft('') });
  };

  if (thread.isLoading) return <LoadingState label="Loading messages" />;
  if (thread.isError || !thread.data) return <ErrorState onRetry={() => void thread.refetch()} />;

  const { studentName, messages } = thread.data;
  return (
    <div className="flex flex-col gap-6">
      <Link to="/messages" className="inline-flex items-center gap-1.5 text-sm font-semibold text-iris-700">
        <ArrowLeft className="size-4" /> All messages
      </Link>
      <PageHeader title={`Parent of ${studentName}`} subtitle="Short notes between you and the family." />
      <ul aria-label={`Messages about ${studentName}`} className="flex flex-col gap-3">
        {messages.map((message) => (
          <li key={message.id} className={cn('flex flex-col gap-1', message.fromParent ? 'items-start' : 'items-end')}>
            <p
              className={cn(
                'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm',
                message.fromParent ? 'bg-iris-50 text-ink' : 'bg-iris-600 text-white',
              )}
            >
              {message.body}
            </p>
            <span className="px-1 text-xs text-ink-faint">
              {message.fromParent ? 'Parent' : 'You'}, {timeOf(message.at)}
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label htmlFor="reply-message" className="sr-only">
          Your reply
        </label>
        <Textarea
          id="reply-message"
          rows={3}
          maxLength={1000}
          placeholder="Write a reply"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        {reply.isError ? (
          <p role="alert" className="text-sm text-coral-700">
            That did not send. Please try again.
          </p>
        ) : null}
        <Button type="submit" isLoading={reply.isPending} disabled={draft.trim() === ''} className="self-end">
          <Send className="size-4" /> Send reply
        </Button>
      </form>
    </div>
  );
}

function InboxRow({ item }: { item: InboxThread }) {
  return (
    <li>
      <Link to={`/messages?student=${item.studentId}`} className="block rounded-3xl focus-visible:outline-2">
        <Card isPlayful className="flex items-center gap-4 p-4">
          <Avatar name={item.studentName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold text-ink">Parent of {item.studentName}</p>
            <p className="truncate text-sm text-ink-muted">
              {item.lastMessage.fromParent ? '' : 'You: '}
              {item.lastMessage.body}
            </p>
          </div>
          {item.unreadCount > 0 ? <Badge>{item.unreadCount} new</Badge> : null}
        </Card>
      </Link>
    </li>
  );
}

/** Messages from parents. Staff reply in a thread a parent has started; they do not start one. */
export function MessagesScreen() {
  const [params] = useSearchParams();
  const inbox = useMessageInbox();
  const studentId = params.get('student');

  if (studentId) return <Thread studentId={studentId} />;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Messages" subtitle="Notes from parents about their children." />
      {inbox.isLoading ? <LoadingState label="Loading messages" /> : null}
      {inbox.isError ? <ErrorState onRetry={() => void inbox.refetch()} /> : null}
      {inbox.data ? (
        inbox.data.threads.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            description="When a parent writes to you, it will show up here."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {inbox.data.threads.map((item) => (
              <InboxRow key={item.studentId} item={item} />
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
