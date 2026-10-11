import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  isApiError,
  MAX_GROWTH_AREAS,
  useActivities,
  useGrowthAreas,
  useObservationDetail,
  useReviewObservation,
  useSchools,
  type DevelopmentArea,
  type ReviewDecision,
  type ReviewOutcome,
} from '@evolveiq/api-client';
import {
  ACTIVITY_TYPE_LABELS,
  BackLink,
  DEVELOPMENT_AREA_LABELS,
  DEVELOPMENT_AREAS,
  formatDay,
  LEARNING_BEHAVIOUR_LABELS,
  OBSERVATION_AREA_ICONS,
  OBSERVATION_AREA_LABELS,
  OBSERVATION_FREQUENCY_LABELS,
  OBSERVATION_LEVEL_LABELS,
  OBSERVATION_WHEN_LABELS,
  ObservationEntry,
  REVIEW_OUTCOME_LABELS,
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
  LoadingState,
  NotebookPen,
  Quote,
  RadioCardGroup,
  RuledList,
  RuledListItem,
  SectionTitle,
  Textarea,
} from '@evolveiq/ui';

const MAX_ACTIVITIES = 10;

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-iris-50 text-xs font-black text-iris-700 ring-1 ring-inset ring-iris-100"
      >
        {step}
      </span>
      <h2 className="text-lg font-black tracking-tight text-ink">{title}</h2>
    </div>
  );
}

/**
 * One observation, everything a psychologist needs to decide on it, and the
 * two actions that close it out. A review is one request: the activities are
 * assigned and the observation is marked reviewed together, and it can't be
 * changed afterwards. On desktop the decision sits beside the words it is about.
 */
export function ObservationDetailScreen() {
  const { observationId } = useParams<{ observationId: string }>();
  const navigate = useNavigate();

  const detail = useObservationDetail(observationId);
  const activities = useActivities();
  const schools = useSchools();
  const growthAreas = useGrowthAreas(detail.data?.observation.student.id);
  const reviewObservation = useReviewObservation();

  const [developmentArea, setDevelopmentArea] = useState<DevelopmentArea | null>(null);
  const [activityIds, setActivityIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string>();

  if (detail.isLoading) return <LoadingState label="Opening the observation" />;
  if (detail.isError || !detail.data) {
    return (
      <ErrorState
        title="We could not open that observation"
        description="Go back to the queue and pick another."
        onRetry={() => navigate('/review-queue')}
      />
    );
  }

  const { observation: entry, history } = detail.data;
  const review = entry.review;
  const isClosed = entry.status !== 'pending';
  const needsArea = entry.level === 'significant';
  const AreaIcon = OBSERVATION_AREA_ICONS[entry.area];
  const library = activities.data ?? [];
  const titleById = new Map(library.map((activity) => [activity.id, activity.title]));
  const schoolName = (schools.data ?? []).find((school) => school.id === entry.schoolId)?.name;

  const toggleActivity = (activityId: string) => {
    setActivityIds((current) =>
      current.includes(activityId) ? current.filter((id) => id !== activityId) : [...current, activityId],
    );
  };

  const submit = async (outcome: ReviewOutcome) => {
    setError(undefined);
    if (needsArea && !developmentArea) {
      setError('Tag a development area first: a Significant observation needs one.');
      return;
    }
    if (outcome === 'assigned' && activityIds.length === 0) {
      setError('Pick at least one activity to assign, or choose “No action needed”.');
      return;
    }
    const shared = {
      ...(developmentArea ? { developmentArea } : {}),
      ...(note.trim() ? { teacherOnlyNote: note.trim() } : {}),
    };
    const decision: ReviewDecision =
      outcome === 'assigned' ? { outcome, activityIds, ...shared } : { outcome: 'no_action', ...shared };
    try {
      await reviewObservation.mutateAsync({ observationId: entry.id, decision });
      navigate('/review-queue');
    } catch (caught) {
      if (isApiError(caught) && caught.status === 409) setError('Someone has already reviewed this observation.');
      else if (isApiError(caught) && caught.status === 422) setError('One of those activities was just archived. Pick another.');
      else setError('We could not save that decision. Try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <BackLink to="/review-queue" className="self-start">
        Review queue
      </BackLink>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <div className="flex min-w-0 flex-col gap-8">
          <Card className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <Avatar name={entry.student.fullName} size="lg" />
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-ink sm:text-3xl">{entry.student.fullName}</h1>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {schoolName ? `${schoolName}, ` : ''}
                  {growthAreas.data ? `${growthAreas.data.length} of ${MAX_GROWTH_AREAS} growth areas open` : ''}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={isClosed ? 'reviewed' : 'pending'}>{isClosed ? 'Reviewed' : 'Awaiting review'}</Badge>
              {entry.level === 'significant' ? <Badge tone="significant">Significant</Badge> : null}
              <Badge icon={AreaIcon}>{OBSERVATION_AREA_LABELS[entry.area]}</Badge>
            </div>

            <Quote
              size="lg"
              attribution={`${entry.author.fullName}, ${entry.author.role === 'parent' ? 'parent' : 'teacher'}, ${formatDay(entry.createdAt)}`}
            >
              {entry.description}
            </Quote>

            <dl className="grid gap-x-6 gap-y-3 border-t border-line-soft pt-5 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <dt className="text-ink-muted">Seen</dt>
                <dd className="mt-0.5 text-ink">{OBSERVATION_WHEN_LABELS[entry.when]}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">How often</dt>
                <dd className="mt-0.5 text-ink">{OBSERVATION_FREQUENCY_LABELS[entry.howOften]}</dd>
              </div>
              {entry.level ? (
                <div>
                  <dt className="text-ink-muted">Level</dt>
                  <dd className="mt-0.5 text-ink">{OBSERVATION_LEVEL_LABELS[entry.level]}</dd>
                </div>
              ) : null}
              {entry.learningBehaviourArea ? (
                <div>
                  <dt className="text-ink-muted">Learning behaviour</dt>
                  <dd className="mt-0.5 text-ink">{LEARNING_BEHAVIOUR_LABELS[entry.learningBehaviourArea]}</dd>
                </div>
              ) : null}
            </dl>
          </Card>

          <section>
            <SectionTitle icon={NotebookPen} iconClassName="text-lilac-500">
              Related history
            </SectionTitle>
            {history.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={NotebookPen}
                title="This is the first observation for this student"
                description="Once more are recorded, they will show here for context."
              />
            ) : (
              <Card className="mt-4 p-6 sm:p-7">
                <RuledList>
                  {history.map((item) => (
                    <RuledListItem
                      key={item.id}
                      tone={item.level === 'significant' ? 'significant' : item.status === 'pending' ? 'pending' : 'default'}
                    >
                      <ObservationEntry
                        observation={item}
                        authorName={`${item.author.fullName} (${item.author.role})`}
                        showClinicalDetail
                        teacherOnlyNote={item.review?.teacherOnlyNote ?? null}
                      />
                    </RuledListItem>
                  ))}
                </RuledList>
              </Card>
            )}
          </section>
        </div>

        <Card as="section" isPlayful className="flex flex-col gap-8 p-6 sm:p-7 lg:sticky lg:top-24">
          {isClosed && review ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-2xl bg-iris-50/80 px-4 py-3.5 text-sm text-iris-800">
                <Check className="size-4 shrink-0" strokeWidth={2.5} />
                {REVIEW_OUTCOME_LABELS[review.outcome]} by {review.reviewedBy.fullName} on {formatDay(review.reviewedAt)}.
              </div>
              <dl className="flex flex-col gap-3 text-sm">
                <div>
                  <dt className="text-ink-muted">Development area</dt>
                  <dd className="mt-0.5 font-semibold text-ink">
                    {review.developmentArea ? DEVELOPMENT_AREA_LABELS[review.developmentArea] : 'Not tagged'}
                  </dd>
                </div>
                {review.activityIds.length > 0 ? (
                  <div>
                    <dt className="text-ink-muted">Activities assigned</dt>
                    <dd className="mt-1">
                      <ul className="flex flex-col gap-1">
                        {review.activityIds.map((activityId) => (
                          <li key={activityId} className="font-semibold text-ink">
                            {titleById.get(activityId) ?? 'An archived activity'}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
                {review.teacherOnlyNote ? (
                  <div>
                    <dt className="text-ink-muted">Note for the teacher</dt>
                    <dd className="mt-0.5 text-ink">{review.teacherOnlyNote}</dd>
                  </div>
                ) : null}
              </dl>
            </div>
          ) : (
            <>
              <p className="-mb-3 text-sm font-semibold text-ink-muted">Your decision</p>
              <div>
                <StepHeading step={1} title="Development area" />
                <p className="mt-1 text-sm text-ink-muted">
                  {needsArea
                    ? 'Needed: this observation is Significant.'
                    : 'Optional. With “Assign & mark reviewed” it becomes one of the student’s growth areas.'}
                </p>
                <RadioCardGroup
                  className="mt-4"
                  columns={2}
                  value={developmentArea}
                  onChange={setDevelopmentArea}
                  options={DEVELOPMENT_AREAS.map((area) => ({ value: area, label: DEVELOPMENT_AREA_LABELS[area] }))}
                />
              </div>

              <div>
                <StepHeading step={2} title="Recommend activities" />
                <p className="mt-1 text-sm text-ink-muted">
                  For “Assign & mark reviewed”: up to {MAX_ACTIVITIES}, set for the student as recommended.
                </p>
                {activities.isLoading ? <LoadingState /> : null}
                {library.length === 0 && !activities.isLoading ? (
                  <p className="mt-4 text-sm text-ink-muted">The library is empty. Add an activity first.</p>
                ) : (
                  <ul className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
                    {library.map((activity) => (
                      <li key={activity.id}>
                        <Checkbox
                          variant="chip"
                          label={`${activity.title} — ${ACTIVITY_TYPE_LABELS[activity.content.type]}`}
                          checked={activityIds.includes(activity.id)}
                          disabled={!activityIds.includes(activity.id) && activityIds.length >= MAX_ACTIVITIES}
                          onChange={() => toggleActivity(activity.id)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <StepHeading step={3} title="Note for the teacher" />
                <p className="mt-1 text-sm text-ink-muted">
                  {entry.author.role === 'teacher'
                    ? `Optional. ${entry.author.fullName} sees it with their observation. Parents never do.`
                    : 'Optional. Kept with the review for psychologists. Parents never see it.'}
                </p>
                <Textarea
                  rows={4}
                  maxLength={2000}
                  className="mt-4"
                  aria-label="Note for the teacher"
                  value={note}
                  placeholder="What should the teaching team do differently?"
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              {error ? (
                <p role="alert" className="rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col gap-2.5 border-t border-line-soft pt-6">
                <Button onClick={() => void submit('assigned')} isLoading={reviewObservation.isPending}>
                  Assign & mark reviewed
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => void submit('no_action')}
                  isLoading={reviewObservation.isPending}
                >
                  No action needed
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
