import type { MediaResponseStep } from '@evolveiq/api-client';
import { Textarea } from '@evolveiq/ui';
import type { ActivityStepRendererProps } from './renderer-types';

export function MediaResponseRenderer({
  step,
  value,
  onChange,
}: ActivityStepRendererProps<MediaResponseStep>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-lg border border-line bg-surface-sunk">
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
      <label className="flex flex-col gap-2">
        <span className="text-base font-medium text-ink">{step.responsePrompt}</span>
        <Textarea
          rows={4}
          className="rounded-lg text-lg"
          value={typeof value === 'string' ? value : ''}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
