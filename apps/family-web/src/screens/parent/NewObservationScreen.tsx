import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateObservation, useStudents, type NewObservation } from '@evolveiq/api-client';
import { BackLink, ObservationForm } from '@evolveiq/domain';
import { Card, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/** What happens to an observation after a parent sends it, in order. */
const NEXT_STEPS = [
  'Your child’s teacher and the school psychologist can read it straight away.',
  'A psychologist reviews it and notes which areas of development it touches.',
  'If a pattern shows up across observations, the school may open a growth area. You will see it on your child’s page.',
];

export function NewObservationScreen() {
  const students = useStudents();
  const createObservation = useCreateObservation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string>();

  if (students.isLoading) return <LoadingState label="Loading" />;
  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

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
            students={students.data ?? []}
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
