import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  useClassRoster,
  useCreateTeacherObservation,
  type NewObservation,
  type ObservationTone,
} from '@evolveiq/api-client';
import { BackLink, ObservationForm } from '@evolveiq/domain';
import { Card, cn, ErrorState, LoadingState, PageHeader, Search, Star, type IconComponent } from '@evolveiq/ui';

/** What happens to an observation after a teacher sends it, for each kind. */
const NEXT_STEPS: { title: string; icon: IconComponent; iconClassName: string; steps: string[] }[] = [
  {
    title: 'Something to celebrate',
    icon: Star,
    iconClassName: 'bg-star-50 text-star-600 ring-star-200 [&>svg]:fill-star-400',
    steps: [
      'It becomes a star on the student’s profile straight away. Nothing goes to the review queue.',
      'The student sees it with your words, and so does their family.',
    ],
  },
  {
    title: 'Something to look into',
    icon: Search,
    iconClassName: 'bg-iris-50 text-iris-600 ring-iris-100',
    steps: [
      'It joins the review queue straight away. Significant ones stand out at the top.',
      'A counsellor reviews it, tags the development area and decides what should happen.',
      'If activities are recommended they are set for the student, and any note for you shows on their profile.',
    ],
  },
];

const isTone = (value: string | null): value is ObservationTone => value === 'positive' || value === 'concern';

/**
 * Same `ObservationForm` the parent app uses — `variant="teacher"` adds Level
 * (for a concern) and the learning-behaviour area.
 */
export function NewObservationScreen() {
  const roster = useClassRoster();
  const createObservation = useCreateTeacherObservation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string>();

  if (roster.isLoading) return <LoadingState label="Loading" />;
  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  const defaultStudentId = searchParams.get('studentId') ?? undefined;
  const requestedTone = searchParams.get('tone');
  const defaultTone = isTone(requestedTone) ? requestedTone : undefined;

  const handleSubmit = async (observation: NewObservation) => {
    setSubmitError(undefined);
    try {
      const created = await createObservation.mutateAsync(observation);
      navigate(`/teacher/students/${created.studentId}`);
    } catch {
      setSubmitError('We could not send that. Check your connection and try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<BackLink to="/teacher/students">My students</BackLink>}
        title={defaultTone === 'positive' ? 'Give a star' : 'New observation'}
        subtitle="Celebrate something a student did well, or raise something for the counsellor to look into."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <Card isPlayful className="p-6 sm:p-8">
          <ObservationForm
            variant="teacher"
            students={roster.students}
            {...(defaultStudentId ? { defaultStudentId } : {})}
            {...(defaultTone ? { defaultTone } : {})}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/teacher/students')}
            isSubmitting={createObservation.isPending}
            {...(submitError ? { submitError } : {})}
          />
        </Card>

        <Card as="aside" tone="tinted" className="flex flex-col gap-6 p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-ink">What happens next</h2>
          {NEXT_STEPS.map((kind) => {
            const Icon = kind.icon;
            return (
              <section key={kind.title}>
                <h3 className="flex items-center gap-2.5 text-sm font-bold text-ink">
                  <span
                    aria-hidden="true"
                    className={cn('flex size-7 items-center justify-center rounded-lg ring-1 ring-inset', kind.iconClassName)}
                  >
                    <Icon className="size-4" />
                  </span>
                  {kind.title}
                </h3>
                <ol className="mt-3 flex flex-col gap-3">
                  {kind.steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold tabular-nums text-iris-700 ring-1 ring-iris-100">
                        {index + 1}
                      </span>
                      <p className="text-sm text-ink-muted">{step}</p>
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
