import { RadioCardGroup } from '@evolveiq/ui';
import type { ActivityRendererProps } from './renderer-types';

/** Single-select options. There is no right answer and no scoring. */
export function McqRenderer({ content, answer, onAnswer }: ActivityRendererProps<'mcq'>) {
  return (
    <RadioCardGroup
      isPlayful
      value={answer?.optionId ?? null}
      onChange={(optionId) => onAnswer({ type: 'mcq', optionId })}
      options={content.options.map((option) => ({ value: option.id, label: option.label }))}
    />
  );
}
