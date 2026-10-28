import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Button, buttonClasses, Card, cn, Input, SendHorizontal } from '@evolveiq/ui';
import {
  matchTopic,
  needsSafetyReply,
  type AssistantSafetyReply,
  type AssistantTopic,
} from './assistant-match';

export interface AssistantChatProps {
  /** The guide's name, shown on its messages. */
  name: string;
  greeting: string;
  topics: AssistantTopic[];
  /** The reply when a typed question matches no topic. */
  fallback: string;
  /** Checked before any topic: what to say when a person, not a guide, is needed. */
  safety?: AssistantSafetyReply;
  /** A pause before each reply, so it reads as an answer. Tests pass 0. */
  replyDelayMs?: number;
  className?: string;
}

interface Message {
  id: number;
  from: 'guide' | 'person';
  text: string;
  link?: { label: string; to: string } | undefined;
}

/**
 * A scripted guide: every answer is written in advance and filled from what
 * the app already knows. There is no agent behind it, no AI and no person,
 * and it says so. A typed question is matched to a topic by its words, and a
 * message that needs a trusted adult gets that answer before anything else.
 */
export function AssistantChat({
  name,
  greeting,
  topics,
  fallback,
  safety,
  replyDelayMs = 600,
  className,
}: AssistantChatProps) {
  const nextId = useRef(1);
  const [messages, setMessages] = useState<Message[]>([{ id: 0, from: 'guide', text: greeting }]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Keep the newest message in view once the conversation has started.
  useEffect(() => {
    if (messages.length > 1) endRef.current?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }, [messages.length, isTyping]);

  const reply = (asked: string, topic?: AssistantTopic) => {
    const answer: Omit<Message, 'id'> = needsSafetyReply(asked, safety)
      ? { from: 'guide', text: safety!.answer, link: safety!.link }
      : topic
        ? { from: 'guide', text: topic.answer, link: topic.link }
        : { from: 'guide', text: fallback };
    const say = () => {
      setMessages((current) => [...current, { ...answer, id: nextId.current++ }]);
      setIsTyping(false);
    };
    setMessages((current) => [...current, { id: nextId.current++, from: 'person', text: asked }]);
    setIsTyping(true);
    clearTimeout(timer.current);
    if (replyDelayMs > 0) timer.current = setTimeout(say, replyDelayMs);
    else say();
  };

  const ask = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isTyping) return;
    setDraft('');
    reply(text, matchTopic(text, topics));
  };

  return (
    <Card isPlayful className={cn('flex flex-col overflow-hidden', className)}>
      <div className="flex items-center gap-3 border-b border-line-soft px-5 py-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-iris-500 to-lilac-500 text-white shadow-glow">
          <Bot className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-black tracking-tight text-ink">{name}</p>
          <p className="text-xs font-medium text-ink-muted">Answers written in advance. Not a person, not a live chat.</p>
        </div>
      </div>

      <div role="log" aria-live="polite" aria-label={`Conversation with ${name}`} className="flex flex-col gap-3 px-4 py-5 sm:px-5">
        {messages.map((message) =>
          message.from === 'guide' ? (
            <div key={message.id} className="flex max-w-[34rem] items-end gap-2.5">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-iris-100 text-iris-600"
              >
                <Bot className="size-4" />
              </span>
              <div className="min-w-0 rounded-2xl rounded-bl-md bg-surface-sunk px-4 py-3 text-[0.9375rem] leading-6 text-ink ring-1 ring-inset ring-line-soft">
                <p>
                  <span className="sr-only">{name}: </span>
                  {message.text}
                </p>
                {message.link ? (
                  <Link
                    to={message.link.to}
                    className={buttonClasses({ size: 'sm', variant: 'secondary', className: 'mt-3' })}
                  >
                    {message.link.label}
                    <ArrowRight />
                  </Link>
                ) : null}
              </div>
            </div>
          ) : (
            <p
              key={message.id}
              className="max-w-[28rem] self-end rounded-2xl rounded-br-md bg-gradient-to-br from-iris-500 to-lilac-500 px-4 py-3 text-[0.9375rem] leading-6 text-white shadow-glow"
            >
              <span className="sr-only">You: </span>
              {message.text}
            </p>
          ),
        )}
        {isTyping ? (
          <div aria-hidden="true" className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full bg-iris-100 text-iris-600">
              <Bot className="size-4" />
            </span>
            <span className="flex gap-1 rounded-2xl bg-surface-sunk px-4 py-3.5 ring-1 ring-inset ring-line-soft">
              <span className="size-1.5 animate-bounce rounded-full bg-ink-faint" />
              <span className="size-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:120ms]" />
              <span className="size-1.5 animate-bounce rounded-full bg-ink-faint [animation-delay:240ms]" />
            </span>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <div className="border-t border-line-soft bg-surface-sunk/60 px-4 py-4 sm:px-5">
        <ul aria-label="Questions you can ask" className="flex flex-wrap gap-2">
          {topics.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                disabled={isTyping}
                onClick={() => reply(topic.question, topic)}
                className="rounded-full border border-iris-100 bg-white px-3.5 py-2 text-left text-sm font-semibold text-iris-700 shadow-card transition-colors hover:bg-iris-50 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
              >
                {topic.question}
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={ask} className="mt-4 flex items-center gap-2">
          <Input
            aria-label={`Ask ${name} a question`}
            value={draft}
            maxLength={300}
            placeholder="Type a question"
            className="h-11 flex-1 rounded-full bg-white"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" aria-label="Send" className="size-11 shrink-0 rounded-full p-0" disabled={!draft.trim() || isTyping}>
            <SendHorizontal className="size-5" />
          </Button>
        </form>
      </div>
    </Card>
  );
}
