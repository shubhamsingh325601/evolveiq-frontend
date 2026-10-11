import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useChildren, useCreateFamilyObservation, type NewObservation } from '@evolveiq/api-client';
import { BackLink, ObservationForm } from '@evolveiq/domain';
import { Card, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/** What happens to an observation after a parent sends it, in order. */
const NEXT_STEPS = [
  'The school psychologist reads every observation that comes in.',
  'They note which area of development it touches and decide what would help.',
  'If an activity would help, your child’s school sets it, and it shows up on your child’s page.',
];

export function NewObservationScreen() {
  const children = useChildren();
  const createObservation = useCreateFamilyObservation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string>();

  if (children.isLoading) return <LoadingState label="Loading" />;
  if (children.isError) return <ErrorState onRetry={() => void children.refetch()} />;

  const defaultStudentId = searchParams.get('childId') ?? undefined;

  const handleSubmit = async (observation: NewObservation) => {
    setSubmitError(undefined);
    try {
      await createObservation.mutateAsync(observation);
      navigate('/parent/observations');
    } catch {
      setSubmitError('We could not send that. Check your connection and try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<BackLink to="/parent/observations">Observations</BackLink>}
        title="Add an observation"
        subtitle="Write down something you noticed. There is no wrong thing to record."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <Card className="p-6 sm:p-8">
          <ObservationForm
            variant="parent"
            students={children.data ?? []}
            {...(defaultStudentId ? { defaultStudentId } : {})}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/parent/observations')}
            isSubmitting={createObservation.isPending}
            {...(submitError ? { submitError } : {})}
          />
        </Card>

        <Card as="aside" tone="tinted" className="p-5 lg:sticky lg:top-10">
          <h2 className="text-base font-medium text-ink">What happens next</h2>
          <ol className="mt-4 flex flex-col gap-4">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold tabular-nums text-iris-700 ring-1 ring-iris-100">
                  {index + 1}
                </span>
                <p className="text-sm text-ink-muted">{step}</p>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </div>
  );
}
