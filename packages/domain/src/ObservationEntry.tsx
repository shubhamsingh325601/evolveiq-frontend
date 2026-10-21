import type {
  LearningBehaviourArea,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
  ObservationStatus,
  ObservationTone,
  ObservationWhen,
} from '@evolveiq/api-client';
import { Badge, CalendarDays, MessageCircle, Quote, Repeat, Star } from '@evolveiq/ui';
import { OBSERVATION_AREA_ICONS } from './area-icons';
import {
  LEARNING_BEHAVIOUR_LABELS,
  OBSERVATION_AREA_LABELS,
  OBSERVATION_FREQUENCY_LABELS,
  OBSERVATION_LEVEL_LABELS,
  OBSERVATION_STATUS_LABELS,
  OBSERVATION_WHEN_LABELS,
  PARENT_OBSERVATION_STATUS_LABELS,
} from './labels';
import { formatRelativeDay } from './format-date';

/** What every audience's observation has in common; staff shapes add Level and the like. */
export interface ObservationEntryData {
  tone: ObservationTone;
  area: ObservationArea;
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  status: ObservationStatus;
  createdAt: string;
  level?: ObservationLevel | null;
  learningBehaviourArea?: LearningBehaviourArea | null;
}

export interface ObservationEntryProps {
  observation: ObservationEntryData;
  /** Who wrote it — shown with when they wrote it. */
  authorName?: string;
  /** Hidden on a student's own profile, where every entry is about them. */
  studentName?: string;
  /**
   * Teacher and psychologist views pass true. Parent views never do — and a
   * parent's observations arrive without those fields at all, so this is a
   * layout decision rather than the safeguard.
   */
  showClinicalDetail?: boolean;
  /** Parents are told where their observation stands in their own words. */
  audience?: 'family' | 'staff';
  /** The psychologist's note back to the teacher who wrote it. Staff views only. */
  teacherOnlyNote?: string | null;
}

export function ObservationEntry({
  observation,
  authorName,
  studentName,
  showClinicalDetail = false,
  audience = 'staff',
  teacherOnlyNote,
}: ObservationEntryProps) {
  const written = formatRelativeDay(observation.createdAt);
  const authorLine = authorName ? `${authorName}, ${written}` : `Written ${written.toLowerCase()}`;
  const statusLabels = audience === 'family' ? PARENT_OBSERVATION_STATUS_LABELS : OBSERVATION_STATUS_LABELS;
  // Something good is a star: never awaiting review, never Significant.
  const isStar = observation.tone === 'positive';
  const isSignificant = !isStar && showClinicalDetail && observation.level === 'significant';

  return (
    <article className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge icon={OBSERVATION_AREA_ICONS[observation.area]}>{OBSERVATION_AREA_LABELS[observation.area]}</Badge>
        {isStar ? (
          <Badge tone="star" icon={Star}>
            {statusLabels.celebrated}
          </Badge>
        ) : (
          <Badge tone={observation.status === 'pending' ? 'pending' : 'reviewed'}>{statusLabels[observation.status]}</Badge>
        )}
        {isSignificant ? <Badge tone="significant">Significant</Badge> : null}
      </div>

      <Quote attribution={studentName ? `${authorLine}, about ${studentName}` : authorLine}>
        {observation.description}
      </Quote>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
        <div className="flex items-center gap-1.5">
          <dt>
            <CalendarDays className="size-4 text-ink-faint" />
            <span className="sr-only">When it was seen</span>
          </dt>
          <dd>{OBSERVATION_WHEN_LABELS[observation.when]}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt>
            <Repeat className="size-4 text-ink-faint" />
            <span className="sr-only">How often</span>
          </dt>
          <dd>{OBSERVATION_FREQUENCY_LABELS[observation.howOften]}</dd>
        </div>
        {showClinicalDetail && !isStar && observation.level && !isSignificant ? (
          <div className="flex items-center gap-1.5 rounded-full bg-iris-50 px-2.5 py-0.5 text-iris-800">
            <dt className="font-medium">Level</dt>
            <dd>{OBSERVATION_LEVEL_LABELS[observation.level]}</dd>
          </div>
        ) : null}
        {showClinicalDetail && observation.learningBehaviourArea ? (
          <div className="flex items-center gap-1.5 rounded-full bg-iris-50 px-2.5 py-0.5 text-iris-800">
            <dt className="font-medium">Learning behaviour</dt>
            <dd>{LEARNING_BEHAVIOUR_LABELS[observation.learningBehaviourArea]}</dd>
          </div>
        ) : null}
      </dl>

      {showClinicalDetail && teacherOnlyNote ? (
        <div className="flex gap-3 rounded-2xl bg-iris-50/80 px-4 py-3 text-sm text-iris-900 ring-1 ring-inset ring-iris-100">
          <MessageCircle className="mt-0.5 size-4 shrink-0 text-iris-500" />
          <p>
            <span className="font-semibold">From the counsellor: </span>
            {teacherOnlyNote}
          </p>
        </div>
      ) : null}
    </article>
  );
}
