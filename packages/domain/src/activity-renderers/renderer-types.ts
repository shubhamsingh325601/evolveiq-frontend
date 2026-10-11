import type { ActivityAnswer, ActivityContent, ActivityType } from '@evolveiq/api-client';

/** Props for the renderer of one activity type: its content in, the student's answer out. */
export interface ActivityRendererProps<TType extends ActivityType> {
  content: Extract<ActivityContent, { type: TType }>;
  /** The answer so far, if it is for this type. */
  answer: Extract<ActivityAnswer, { type: TType }> | undefined;
  onAnswer: (answer: Extract<ActivityAnswer, { type: TType }>) => void;
}
