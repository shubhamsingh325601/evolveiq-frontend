import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateObservation, useStudents, type NewObservation } from '@evolveiq/api-client';
import { BackLink, ObservationForm } from '@evolveiq/domain';
import { Card, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/** What happens to an observation after a teacher sends it, in order. */
const NEXT_STEPS = [
  'It joins the review queue straight away. Flagged ones go to the top.',
  'A psychologist confirms the development area and decides what should happen.',
  'If an activity is recommended, it is set for the student and you can follow it on their profile.',
];

/**
 * Same `ObservationForm` the parent app uses — `variant="teacher"` adds Level,
 * the learning-behaviour area and the significance flag.
 */
export function NewObservationScreen() {
  const students = useStudents();
  const createObservation = useCreateObservation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState<string>();

  if (students.isLoading) return <LoadingState label="Loading" />;
  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const defaultStudentId = searchParams.get('studentId') ?? undefined;

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
        title="New observation"
        subtitle="What you record goes to the psychologist's review queue."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <Card isPlayful className="p-6 sm:p-8">
          <ObservationForm
            variant="teacher"
            students={students.data ?? []}
            {...(defaultStudentId ? { defaultStudentId } : {})}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/teacher/students')}
            isSubmitting={createObservation.isPending}
            {...(submitError ? { submitError } : {})}
          />
        </Card>

        <Card as="aside" tone="tinted" className="p-5 lg:sticky lg:top-24">
          <h2 className="text-base font-bold text-ink">What happens next</h2>
          <ol className="mt-4 flex flex-col gap-4">
            {NEXT_STEPS.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold tabular-nums text-iris-700 ring-1 ring-iris-100">
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
