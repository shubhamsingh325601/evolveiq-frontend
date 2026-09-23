import type { ActivityResponse, ActivityStep } from '@evolveiq/api-client';

export type StepValue = ActivityResponse['value'];

export interface ActivityStepRendererProps<TStep extends ActivityStep = ActivityStep> {
  step: TStep;
  value: StepValue | undefined;
  onChange: (value: StepValue) => void;
}
