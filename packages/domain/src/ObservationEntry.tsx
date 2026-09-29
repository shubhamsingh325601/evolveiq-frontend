import type { Observation } from '@evolveiq/api-client';
import { Badge, MapPin, Quote, Repeat } from '@evolveiq/ui';
import { DEVELOPMENT_AREA_ICONS } from './area-icons';
import {
  DEVELOPMENT_AREA_LABELS,
  LEARNING_BEHAVIOUR_LABELS,
  LEVEL_LABELS,
  OBSERVATION_CONTEXT_LABELS,
  OBSERVATION_FREQUENCY_LABELS,
  OBSERVATION_STATUS_LABELS,
} from './labels';
import { formatRelativeDay } from './format-date';

export interface ObservationEntryProps {
  observation: Observation;
  /**
   * Teacher and psychologist views pass true. Parent and student views never
   * do — and the fields are stripped server-side as well, so this is a layout
   * decision rather than the safeguard.
   */
  showClinicalDetail?: boolean;
  /** Hidden on a student's own profile, where every entry is about them. */
  studentName?: string;
}

export function ObservationEntry({
  observation,
  showClinicalDetail = false,
  studentName,
}: ObservationEntryProps) {
  const authorLine = `${observation.authorName}, ${formatRelativeDay(observation.observedAt)}`;

  return (
    <article className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge icon={DEVELOPMENT_AREA_ICONS[observation.area]}>
          {DEVELOPMENT_AREA_LABELS[observation.area]}
        </Badge>
        <Badge tone={observation.status === 'pending' ? 'pending' : 'reviewed'}>
          {OBSERVATION_STATUS_LABELS[observation.status]}
        </Badge>
        {showClinicalDetail && observation.isSignificant ? (
          <Badge tone="significant">Flagged significant</Badge>
        ) : null}
      </div>

      <Quote attribution={studentName ? `${authorLine}, about ${studentName}` : authorLine}>
        {observation.body}
      </Quote>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
        <div className="flex items-center gap-1.5">
          <dt>
            <MapPin className="size-4 text-ink-faint" />
            <span className="sr-only">Where</span>
          </dt>
          <dd>{OBSERVATION_CONTEXT_LABELS[observation.context]}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt>
            <Repeat className="size-4 text-ink-faint" />
            <span className="sr-only">How often</span>
          </dt>
          <dd>{OBSERVATION_FREQUENCY_LABELS[observation.frequency]}</dd>
        </div>
        {showClinicalDetail && observation.level ? (
          <div className="flex items-center gap-1.5 rounded-full bg-iris-50 px-2.5 py-0.5 text-iris-800">
            <dt className="font-medium">Level</dt>
            <dd>{LEVEL_LABELS[observation.level]}</dd>
          </div>
        ) : null}
        {showClinicalDetail && observation.learningBehaviourArea ? (
          <div className="flex items-center gap-1.5 rounded-full bg-iris-50 px-2.5 py-0.5 text-iris-800">
            <dt className="font-medium">Learning behaviour</dt>
            <dd>{LEARNING_BEHAVIOUR_LABELS[observation.learningBehaviourArea]}</dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
