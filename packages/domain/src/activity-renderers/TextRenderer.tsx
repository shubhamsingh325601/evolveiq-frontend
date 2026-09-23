import type { TextStep } from '@evolveiq/api-client';
import { Textarea } from '@evolveiq/ui';
import type { ActivityStepRendererProps } from './renderer-types';

export function TextRenderer({ step, value, onChange }: ActivityStepRendererProps<TextStep>) {
  return (
    <Textarea
      rows={5}
      className="rounded-lg text-lg"
      placeholder={step.placeholder ?? 'Type your answer'}
      value={typeof value === 'string' ? value : ''}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
