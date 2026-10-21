import type {
  ActivityType,
  DevelopmentArea,
  HolisticDimension,
  LearningBehaviourArea,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
  ObservationStatus,
  ObservationTone,
  ObservationWhen,
  ReviewOutcome,
} from '@evolveiq/api-client';

/**
 * The product's vocabulary, in one place. Screens never hand-write these
 * strings, so a wording change lands everywhere at once. The value lists are
 * the lead-confirmed ones the backend stores, and the labels are the
 * backend's own (`observation-options.ts`), so the API docs and the screens
 * read the same.
 */

/**
 * What kind of observation it is — the first thing anyone recording one
 * chooses. Something good is a star for the child; something to look into
 * goes to the school counsellor.
 */
export const OBSERVATION_TONE_LABELS: Record<ObservationTone, string> = {
  positive: 'Something to celebrate',
  concern: 'Something to look into',
};

/** In that order: good news comes first. */
export const OBSERVATION_TONES: ObservationTone[] = ['positive', 'concern'];

/** What an observation is about, as the parent or teacher sees it. */
export const OBSERVATION_AREA_LABELS: Record<ObservationArea, string> = {
  emotions: 'Emotions & feelings',
  behaviour: 'Behaviour',
  social: 'Friends & social',
  learning: 'Learning & focus',
  communication: 'Communication',
  physical: 'Physical & movement',
  routines: 'Sleep, eating & routines',
  other: 'Other',
};

export const OBSERVATION_AREAS = Object.keys(OBSERVATION_AREA_LABELS) as ObservationArea[];

export const OBSERVATION_WHEN_LABELS: Record<ObservationWhen, string> = {
  today: 'Today',
  this_week: 'This week',
  this_month: 'This month',
  over_a_month: 'More than a month ago',
};

export const OBSERVATION_FREQUENCY_LABELS: Record<ObservationFrequency, string> = {
  once: 'Just once',
  sometimes: 'Sometimes',
  often: 'Often',
  daily: 'Every day',
};

/** Teachers only, and concerns only: how worrying it is. Never shown to a parent. */
export const OBSERVATION_LEVEL_LABELS: Record<ObservationLevel, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  significant: 'Significant',
};

export const OBSERVATION_LEVELS = Object.keys(OBSERVATION_LEVEL_LABELS) as ObservationLevel[];

/** Teachers only; never shown to a parent. */
export const LEARNING_BEHAVIOUR_LABELS: Record<LearningBehaviourArea, string> = {
  attention: 'Attention & focus',
  participation: 'Class participation',
  following_instructions: 'Following instructions',
  task_completion: 'Finishing classwork & homework',
  organisation: 'Organisation',
  working_with_others: 'Working with others',
  self_control: 'Self-control in class',
  other: 'Other',
};

export const LEARNING_BEHAVIOUR_AREAS = Object.keys(LEARNING_BEHAVIOUR_LABELS) as LearningBehaviourArea[];

/**
 * The psychologist's review tag. Growth areas are named with these labels —
 * the API sends a growth area's name, not its value.
 */
export const DEVELOPMENT_AREA_LABELS: Record<DevelopmentArea, string> = {
  managing_feelings: 'Managing feelings',
  social_skills: 'Friendships & social skills',
  communication: 'Communication',
  focus_attention: 'Focus & attention',
  self_control: 'Self-control',
  confidence: 'Confidence & self-esteem',
  resilience: 'Coping & resilience',
  independence: 'Independence & routines',
  learning_skills: 'Learning skills',
  motor_skills: 'Movement & coordination',
};

export const DEVELOPMENT_AREAS = Object.keys(DEVELOPMENT_AREA_LABELS) as DevelopmentArea[];

const DEVELOPMENT_AREA_BY_LABEL = new Map(
  DEVELOPMENT_AREAS.map((area) => [DEVELOPMENT_AREA_LABELS[area], area] as const),
);

/** The development area a growth area's name stands for, if it is one of ours. */
export function developmentAreaForName(name: string): DevelopmentArea | undefined {
  return DEVELOPMENT_AREA_BY_LABEL.get(name);
}

/** Staff wording. Parents see their own words for the same three states. */
export const OBSERVATION_STATUS_LABELS: Record<ObservationStatus, string> = {
  pending: 'Awaiting review',
  reviewed: 'Reviewed',
  celebrated: 'Star given',
};

/** How a parent is told where their observation stands. */
export const PARENT_OBSERVATION_STATUS_LABELS: Record<ObservationStatus, string> = {
  pending: 'Awaiting review',
  reviewed: 'Read by the school',
  celebrated: 'Star given',
};

/** Who gave a star, in a phrase: "Sunita Rao, teacher". */
export const STAR_GIVER_LABELS: Record<'parent' | 'teacher', string> = {
  teacher: 'teacher',
  parent: 'parent',
};

export const REVIEW_OUTCOME_LABELS: Record<ReviewOutcome, string> = {
  assigned: 'Assigned and reviewed',
  no_action: 'No action needed',
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  mcq: 'Multiple choice',
  text: 'Written answer',
  image_pick: 'Pick an image',
  rating: 'Rating, 1 to 5',
  media_response: 'Media and response',
};

export const ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[];

/**
 * The EvolvIQ Holistic Index's five pillars. "Wellbeing" draws on engagement,
 * confidence and participation; it is a development indicator, never a
 * diagnosis, which is why it is not called "mental health".
 */
export const HOLISTIC_DIMENSION_LABELS: Record<HolisticDimension, string> = {
  education: 'Education',
  skills: 'Skills',
  physical: 'Physical',
  wellbeing: 'Wellbeing',
  character: 'Character',
};
