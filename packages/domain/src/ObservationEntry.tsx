import type { Observation } from '@evolveiq/api-client';
import { Badge, Quote } from '@evolveiq/ui';
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
    <article className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{DEVELOPMENT_AREA_LABELS[observation.area]}</Badge>
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

      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-muted">
        <div className="flex gap-1.5">
          <dt>Where</dt>
          <dd className="text-ink">{OBSERVATION_CONTEXT_LABELS[observation.context]}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt>How often</dt>
          <dd className="text-ink">{OBSERVATION_FREQUENCY_LABELS[observation.frequency]}</dd>
        </div>
        {showClinicalDetail && observation.level ? (
          <div className="flex gap-1.5">
            <dt>Level</dt>
            <dd className="text-ink">{LEVEL_LABELS[observation.level]}</dd>
          </div>
        ) : null}
        {showClinicalDetail && observation.learningBehaviourArea ? (
          <div className="flex gap-1.5">
            <dt>Learning behaviour</dt>
            <dd className="text-ink">
              {LEARNING_BEHAVIOUR_LABELS[observation.learningBehaviourArea]}
            </dd>
          </div>
        ) : null}
      </dl>
    </article>
  );
}
