import { Textarea } from '@evolveiq/ui';
import type { ActivityRendererProps } from './renderer-types';

/** The longest answer the backend accepts. */
export const ANSWER_TEXT_MAX = 2000;

export function TextRenderer({ content, answer, onAnswer }: ActivityRendererProps<'text'>) {
  return (
    <Textarea
      rows={5}
      maxLength={ANSWER_TEXT_MAX}
      aria-label={content.prompt}
      className="rounded-2xl px-4 py-3.5 text-lg leading-8"
      placeholder="Type your answer"
      value={answer?.text ?? ''}
      onChange={(event) => onAnswer({ type: 'text', text: event.target.value })}
    />
  );
}
