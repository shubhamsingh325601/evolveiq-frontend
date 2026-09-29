import type { MediaResponseStep } from '@evolveiq/api-client';
import { Textarea } from '@evolveiq/ui';
import type { ActivityStepRendererProps } from './renderer-types';

export function MediaResponseRenderer({
  step,
  value,
  onChange,
}: ActivityStepRendererProps<MediaResponseStep>) {
  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-2xl bg-surface-sunk ring-1 ring-line">
        {step.mediaType === 'image' ? (
          <img src={step.mediaUrl} alt="" className="w-full object-cover" />
        ) : null}
        {step.mediaType === 'audio' ? (
          <audio controls src={step.mediaUrl} className="w-full p-4">
            Your browser cannot play this audio.
          </audio>
        ) : null}
        {step.mediaType === 'video' ? (
          <video controls src={step.mediaUrl} className="w-full">
            Your browser cannot play this video.
          </video>
        ) : null}
      </div>
      <label className="flex flex-col gap-2.5">
        <span className="text-lg font-medium text-ink">{step.responsePrompt}</span>
        <Textarea
          rows={4}
          className="rounded-2xl px-4 py-3.5 text-lg leading-8"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
