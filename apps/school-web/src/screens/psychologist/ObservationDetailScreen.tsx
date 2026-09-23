import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useActivities,
  useAssignActivity,
  useObservation,
  useObservations,
  useReviewObservation,
  useStudent,
} from '@evolveiq/api-client';
import type { DevelopmentArea } from '@evolveiq/api-client';
import {
  DEVELOPMENT_AREA_LABELS,
  DEVELOPMENT_AREAS,
  ObservationEntry,
  ageFromDateOfBirth,
  formatDay,
} from '@evolveiq/domain';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  Quote,
  RuledList,
  RuledListItem,
  Select,
  Textarea,
  cn,
} from '@evolveiq/ui';

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

/**
 * One observation, everything a psychologist needs to decide on it, and the
 * two actions that close it out.
 */
export function ObservationDetailScreen() {
  const { observationId } = useParams<{ observationId: string }>();
  const navigate = useNavigate();

  const observation = useObservation(observationId);
  const student = useStudent(observation.data?.studentId);
  const history = useObservations(
    observation.data ? { studentId: observation.data.studentId } : {},
  );
  const activities = useActivities();
  const reviewObservation = useReviewObservation();
  const assignActivity = useAssignActivity();

  const [taggedAreas, setTaggedAreas] = useState<DevelopmentArea[] | null>(null);
  const [teacherOnlyNote, setTeacherOnlyNote] = useState<string | null>(null);
  const [activityId, setActivityId] = useState('');
  const [error, setError] = useState<string>();

  if (observation.isLoading) return <LoadingState label="Opening the observation" />;
  if (observation.isError || !observation.data) {
    return (
      <ErrorState
        title="We could not open that observation"
        description="It may have been removed. Go back to the queue and pick another."
        onRetry={() => navigate('/review-queue')}
      />
    );
  }

  const entry = observation.data;
  const isClosed = entry.status !== 'pending';
  const areas = taggedAreas ?? entry.taggedAreas ?? [entry.area];
  const note = teacherOnlyNote ?? entry.teacherOnlyNote ?? '';
  const relatedHistory = (history.data ?? []).filter((item) => item.id !== entry.id);

  const toggleArea = (area: DevelopmentArea) => {
    setTaggedAreas(
      areas.includes(area) ? areas.filter((candidate) => candidate !== area) : [...areas, area],
    );
  };

  const submitReview = async (status: 'reviewed' | 'no-action-needed') => {
    setError(undefined);
    try {
      if (status === 'reviewed' && activityId) {
        await assignActivity.mutateAsync({
          activityId,
          studentId: entry.studentId,
          dueOn: todayIsoDate(),
        });
      }
      await reviewObservation.mutateAsync({
        observationId: entry.id,
        status,
        taggedAreas: areas,
        ...(note.trim() ? { teacherOnlyNote: note.trim() } : {}),
      });
      navigate('/review-queue');
    } catch {
      setError('We could not save that decision. Try again.');
    }
  };

  const isSaving = reviewObservation.isPending || assignActivity.isPending;

  return (
    <div className="flex flex-col gap-9">
      <header className="border-b border-line pb-6">
        <Link
          to="/review-queue"
          className="text-sm font-medium text-teal-600 underline underline-offset-4"
        >
          Back to the queue
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge tone={entry.status === 'pending' ? 'pending' : 'reviewed'}>
            {entry.status === 'pending' ? 'Awaiting review' : 'Reviewed'}
          </Badge>
          {entry.isSignificant ? <Badge tone="significant">Flagged significant</Badge> : null}
          <Badge tone="neutral">{DEVELOPMENT_AREA_LABELS[entry.area]}</Badge>
        </div>

        <Quote
          size="lg"
          className="mt-5"
          attribution={`${entry.authorName}, ${
            entry.authorRole === 'parent' ? 'parent' : 'teacher'
          }, ${formatDay(entry.observedAt)}`}
        >
          {entry.body}
        </Quote>
      </header>

      <section className="grid gap-5 sm:grid-cols-2">
        <Card className="px-5 py-4">
          <h2 className="text-sm font-medium text-ink-muted">Student</h2>
          {student.data ? (
            <>
              <p className="mt-1 font-serif text-xl text-ink">{student.data.name}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {ageFromDateOfBirth(student.data.dateOfBirth)} years old,{' '}
                {student.data.growthAreaIds.length} of 5 growth areas open
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-ink-muted">Loading</p>
          )}
        </Card>
        <Card className="px-5 py-4">
          <h2 className="text-sm font-medium text-ink-muted">Recorded</h2>
          <dl className="mt-2 flex flex-col gap-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Seen on</dt>
              <dd className="text-ink">{formatDay(entry.observedAt)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Submitted</dt>
              <dd className="text-ink">{formatDay(entry.createdAt)}</dd>
            </div>
            {entry.level ? (
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Level</dt>
                <dd className="tabular-nums text-ink">{entry.level} of 5</dd>
              </div>
            ) : null}
          </dl>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Development areas</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">
          Confirm the area this belongs to, or add others it touches.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {DEVELOPMENT_AREAS.map((area) => (
            <Checkbox
              key={area}
              label={DEVELOPMENT_AREA_LABELS[area]}
              checked={areas.includes(area)}
              disabled={isClosed}
              onChange={() => toggleArea(area)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Recommend an activity</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">
          Assigning is optional. If you pick one, it is set when you mark this reviewed.
        </p>
        <div className="mt-4 max-w-md">
          <FormField label="Activity from the library" isOptional>
            <Select
              value={activityId}
              disabled={isClosed}
              onChange={(event) => setActivityId(event.target.value)}
            >
              <option value="">No activity</option>
              {(activities.data ?? []).map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title} — {DEVELOPMENT_AREA_LABELS[activity.area]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Note for teachers</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">
          Seen by teachers and psychologists only. Parents never see this.
        </p>
        <div className="mt-4 max-w-prose">
          <Textarea
            rows={4}
            value={note}
            disabled={isClosed}
            placeholder="What should the teaching team do differently?"
            onChange={(event) => setTeacherOnlyNote(event.target.value)}
          />
        </div>
      </section>

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <div
        className={cn(
          'flex flex-wrap items-center gap-3 border-t border-line pt-6',
          isClosed && 'opacity-70',
        )}
      >
        {isClosed ? (
          <p className="text-sm text-ink-muted">
            This was reviewed on {entry.reviewedAt ? formatDay(entry.reviewedAt) : 'an earlier date'}.
          </p>
        ) : (
          <>
            <Button onClick={() => void submitReview('reviewed')} isLoading={isSaving}>
              {activityId ? 'Assign and mark reviewed' : 'Mark reviewed'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void submitReview('no-action-needed')}
              isLoading={isSaving}
            >
              No action needed
            </Button>
          </>
        )}
      </div>

      <section>
        <h2 className="text-xl font-semibold text-ink">Related history</h2>
        {history.isLoading ? <LoadingState /> : null}
        {relatedHistory.length === 0 && !history.isLoading ? (
          <EmptyState
            className="mt-4"
            title="This is the first observation for this student"
            description="Once more are recorded, they will show here for context."
          />
        ) : (
          <RuledList className="mt-5">
            {relatedHistory.map((item) => (
              <RuledListItem
                key={item.id}
                tone={
                  item.isSignificant
                    ? 'significant'
                    : item.status === 'pending'
                      ? 'pending'
                      : 'default'
                }
              >
                <ObservationEntry observation={item} showClinicalDetail />
              </RuledListItem>
            ))}
          </RuledList>
        )}
      </section>
    </div>
  );
}
