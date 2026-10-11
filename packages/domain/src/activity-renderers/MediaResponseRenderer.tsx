import { Textarea } from '@evolveiq/ui';
import { mediaKindOf } from './media-kind';
import type { ActivityRendererProps } from './renderer-types';
import { ANSWER_TEXT_MAX } from './TextRenderer';

export function MediaResponseRenderer({ content, answer, onAnswer }: ActivityRendererProps<'media_response'>) {
  const kind = mediaKindOf(content.mediaUrl);
  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl bg-surface-sunk ring-1 ring-line">
        {kind === 'video' ? (
          <video controls src={content.mediaUrl} className="w-full">
            Your browser cannot play this video.
          </video>
        ) : null}
        {kind === 'audio' ? (
          <audio controls src={content.mediaUrl} className="w-full p-4">
            Your browser cannot play this audio.
          </audio>
        ) : null}
        {kind === 'image' ? <img src={content.mediaUrl} alt="" className="w-full object-cover" /> : null}
        {kind === 'link' ? (
          <a
            href={content.mediaUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="block px-5 py-4 text-base font-semibold text-iris-700 underline-offset-4 hover:underline"
          >
            Open it in a new tab
          </a>
        ) : null}
      </div>
      <label className="flex flex-col gap-2.5">
        <span className="text-lg font-medium text-ink">Your answer</span>
        <Textarea
          rows={4}
          maxLength={ANSWER_TEXT_MAX}
          className="rounded-2xl px-4 py-3.5 text-lg leading-8"
          value={answer?.text ?? ''}
          onChange={(event) => onAnswer({ type: 'media_response', text: event.target.value })}
        />
      </label>
    </div>
  );
}
