import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  BackLink,
  DEVELOPMENT_AREA_ICONS,
  DEVELOPMENT_AREA_LABELS,
  DEVELOPMENT_AREAS,
  ObservationEntry,
  ageFromDateOfBirth,
  formatDay,
} from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Check,
  Checkbox,
  EmptyState,
  ErrorState,
  FormField,
  LoadingState,
  NotebookPen,
  Quote,
  RuledList,
  RuledListItem,
  SectionTitle,
  Select,
  Textarea,
} from '@evolveiq/ui';

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

/**
 * One observation, everything a psychologist needs to decide on it, and the
 * two actions that close it out. On desktop the decision sits beside the
 * words it is about.
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
  const AreaIcon = DEVELOPMENT_AREA_ICONS[entry.area];

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
    <div className="flex flex-col gap-8">
      <BackLink to="/review-queue" className="self-start">
        Review queue
      </BackLink>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,23rem)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <Card className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              {student.data ? <Avatar name={student.data.name} size="lg" /> : null}
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">
                  {student.data?.name ?? 'Observation'}
                </h1>
                {student.data ? (
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {ageFromDateOfBirth(student.data.dateOfBirth)} years old,{' '}
                    {student.data.growthAreaIds.length} of 5 growth areas open
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={entry.status === 'pending' ? 'pending' : 'reviewed'}>
                {entry.status === 'pending' ? 'Awaiting review' : 'Reviewed'}
              </Badge>
              {entry.isSignificant ? <Badge tone="significant">Flagged significant</Badge> : null}
              <Badge icon={AreaIcon}>{DEVELOPMENT_AREA_LABELS[entry.area]}</Badge>
            </div>

            <Quote
              size="lg"
              attribution={`${entry.authorName}, ${
                entry.authorRole === 'parent' ? 'parent' : 'teacher'
              }, ${formatDay(entry.observedAt)}`}
            >
              {entry.body}
            </Quote>

            <dl className="grid gap-x-6 gap-y-3 border-t border-line-soft pt-5 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-ink-muted">Seen on</dt>
                <dd className="mt-0.5 text-ink">{formatDay(entry.observedAt)}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Submitted</dt>
                <dd className="mt-0.5 text-ink">{formatDay(entry.createdAt)}</dd>
              </div>
              {entry.level ? (
                <div>
                  <dt className="text-ink-muted">Level</dt>
                  <dd className="mt-0.5 tabular-nums text-ink">{entry.level} of 5</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <section>
            <SectionTitle icon={NotebookPen} iconClassName="text-lilac-500">
              Related history
            </SectionTitle>
            {history.isLoading ? <LoadingState /> : null}
            {relatedHistory.length === 0 && !history.isLoading ? (
              <EmptyState
                className="mt-4"
                icon={NotebookPen}
                title="This is the first observation for this student"
                description="Once more are recorded, they will show here for context."
              />
            ) : (
              <Card className="mt-4 p-6 sm:p-7">
                <RuledList>
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
              </Card>
            )}
          </section>
        </div>

        <Card as="section" isPlayful className="flex flex-col gap-8 p-6 sm:p-7 lg:sticky lg:top-24">
          <p className="-mb-3 text-sm font-semibold text-ink-muted">Your decision</p>
          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-iris-50 text-xs font-black text-iris-700 ring-1 ring-inset ring-iris-100"
              >
                1
              </span>
              <h2 className="text-lg font-black tracking-tight text-ink">Development areas</h2>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Confirm the area this belongs to, or add others it touches.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {DEVELOPMENT_AREAS.map((area) => (
                <Checkbox
                  key={area}
                  variant="chip"
                  label={DEVELOPMENT_AREA_LABELS[area]}
                  checked={areas.includes(area)}
                  disabled={isClosed}
                  onChange={() => toggleArea(area)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-iris-50 text-xs font-black text-iris-700 ring-1 ring-inset ring-iris-100"
              >
                2
              </span>
              <h2 className="text-lg font-black tracking-tight text-ink">Recommend an activity</h2>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Optional. If you pick one, it is set when you mark this reviewed.
            </p>
            <FormField label="Activity from the library" isOptional className="mt-4">
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

          <div>
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-iris-50 text-xs font-black text-iris-700 ring-1 ring-inset ring-iris-100"
              >
                3
              </span>
              <h2 className="text-lg font-black tracking-tight text-ink">Note for teachers</h2>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Seen by teachers and psychologists only. Parents never see this.
            </p>
            <Textarea
              rows={4}
              className="mt-4"
              aria-label="Note for teachers"
              value={note}
              disabled={isClosed}
              placeholder="What should the teaching team do differently?"
              onChange={(event) => setTeacherOnlyNote(event.target.value)}
            />
          </div>

          {error ? <ErrorState title="That did not save" description={error} /> : null}

          {isClosed ? (
            <div className="flex items-center gap-3 rounded-2xl bg-iris-50/80 px-4 py-3.5 text-sm text-iris-800">
              <Check className="size-4 shrink-0" strokeWidth={2.5} />
              This was reviewed on{' '}
              {entry.reviewedAt ? formatDay(entry.reviewedAt) : 'an earlier date'}.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 border-t border-line-soft pt-6">
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
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
