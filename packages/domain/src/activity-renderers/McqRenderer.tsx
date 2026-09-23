import type { McqStep } from '@evolveiq/api-client';
import { RadioCardGroup } from '@evolveiq/ui';
import type { ActivityStepRendererProps } from './renderer-types';

export function McqRenderer({ step, value, onChange }: ActivityStepRendererProps<McqStep>) {
  return (
    <RadioCardGroup
      isPlayful
      name={step.id}
      value={typeof value === 'string' ? value : null}
      onChange={onChange}
      options={step.options.map((option) => ({ value: option.id, label: option.label }))}
    />
  );
}
