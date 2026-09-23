import type {
  ActivityStepKind,
  AssignmentStatus,
  DevelopmentArea,
  LearningBehaviourArea,
  ObservationContext,
  ObservationFrequency,
  ObservationStatus,
} from '@evolveiq/api-client';

/**
 * The product's vocabulary, in one place. Screens never hand-write these
 * strings, so a wording change lands everywhere at once.
 */

export const DEVELOPMENT_AREA_LABELS: Record<DevelopmentArea, string> = {
  'focus-and-attention': 'Focus and attention',
  'emotional-regulation': 'Emotional regulation',
  'social-interaction': 'Social interaction',
  'language-and-expression': 'Language and expression',
  'motor-skills': 'Motor skills',
  'problem-solving': 'Problem solving',
  independence: 'Independence',
  'memory-and-recall': 'Memory and recall',
};

export const DEVELOPMENT_AREAS = Object.keys(DEVELOPMENT_AREA_LABELS) as DevelopmentArea[];

export const LEARNING_BEHAVIOUR_LABELS: Record<LearningBehaviourArea, string> = {
  engagement: 'Engagement',
  persistence: 'Persistence',
  'self-direction': 'Self-direction',
  collaboration: 'Collaboration',
  'following-instructions': 'Following instructions',
};

export const LEARNING_BEHAVIOUR_AREAS = Object.keys(
  LEARNING_BEHAVIOUR_LABELS,
) as LearningBehaviourArea[];

export const OBSERVATION_CONTEXT_LABELS: Record<ObservationContext, string> = {
  'at-home': 'At home',
  'in-class': 'In class',
  'during-play': 'During play',
  'during-transitions': 'During transitions',
};

export const OBSERVATION_FREQUENCY_LABELS: Record<ObservationFrequency, string> = {
  'first-time': 'First time I have seen it',
  occasionally: 'Every so often',
  weekly: 'About once a week',
  daily: 'Most days',
};

export const OBSERVATION_STATUS_LABELS: Record<ObservationStatus, string> = {
  pending: 'Awaiting review',
  reviewed: 'Reviewed',
  'no-action-needed': 'No action needed',
};

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  assigned: 'To do',
  'in-progress': 'Started',
  completed: 'Done',
};

export const ACTIVITY_STEP_LABELS: Record<ActivityStepKind, string> = {
  mcq: 'Multiple choice',
  text: 'Written answer',
  'image-pick': 'Pick an image',
  rating: 'Rating, 1 to 5',
  'media-response': 'Media and response',
};

/** Level is a teacher-entered 1-5 judgement; never shown to a parent. */
export const LEVEL_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: '1 — Needs full support',
  2: '2 — Needs frequent prompting',
  3: '3 — Manages with reminders',
  4: '4 — Mostly independent',
  5: '5 — Fully independent',
};
