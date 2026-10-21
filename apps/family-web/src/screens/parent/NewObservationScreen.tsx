import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChildren, useCreateFamilyObservation, type NewObservation, type ObservationTone } from '@evolveiq/api-client';
import { BackLink, ObservationForm } from '@evolveiq/domain';
import { Card, cn, ErrorState, LoadingState, PageHeader, Search, Star, type IconComponent } from '@evolveiq/ui';

/** What happens to an observation after a parent sends it, for each kind. */
const NEXT_STEPS: { title: string; icon: IconComponent; iconClassName: string; steps: string[] }[] = [
  {
    title: 'Something to celebrate',
    icon: Star,
    iconClassName: 'bg-star-50 text-star-600 ring-star-200 [&>svg]:fill-star-400',
    steps: [
      'It becomes a star on your child’s profile straight away.',
      'Your child sees the star with your words, and so do their teachers.',
    ],
  },
  {
    title: 'Something to look into',
    icon: Search,
    iconClassName: 'bg-iris-50 text-iris-600 ring-iris-100',
    steps: [
      'The school counsellor reads every concern that comes in.',
      'They note which area of development it touches and decide what would help.',
      'If an activity would help, the school sets it, and it shows up on your child’s page.',
    ],
  },
];

const isTone = (value: string | null): value is ObservationTone => value === 'positive' || value === 'concern';

export function NewObservationScreen() {
  const children = useChildren();
  const createObservation = useCreateFamilyObservation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string>();

  if (children.isLoading) return <LoadingState label="Loading" />;
  if (children.isError) return <ErrorState onRetry={() => void children.refetch()} />;

  const defaultStudentId = searchParams.get('childId') ?? undefined;
  const requestedTone = searchParams.get('tone');
  const defaultTone = isTone(requestedTone) ? requestedTone : undefined;

  const handleSubmit = async (observation: NewObservation) => {
    setSubmitError(undefined);
    try {
      await createObservation.mutateAsync(observation);
      // A star is worth seeing land: back to the child it was given to.
      navigate(observation.tone === 'positive' ? `/parent/children/${observation.studentId}` : '/parent/observations');
    } catch {
      setSubmitError('We could not send that. Check your connection and try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<BackLink to="/parent/observations">Observations</BackLink>}
        title="Add an observation"
        subtitle="Celebrate something good, or write down something to look into. There is no wrong thing to record."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <Card className="p-6 sm:p-8">
          <ObservationForm
            variant="parent"
            students={children.data ?? []}
            {...(defaultStudentId ? { defaultStudentId } : {})}
            {...(defaultTone ? { defaultTone } : {})}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/parent/observations')}
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
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold tabular-nums text-iris-700 ring-1 ring-iris-100">
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
