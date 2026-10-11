import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useClassRoster, useCreateTeacherObservation, type NewObservation } from '@evolveiq/api-client';
import { BackLink, ObservationForm } from '@evolveiq/domain';
import { Card, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/** What happens to an observation after a teacher sends it, in order. */
const NEXT_STEPS = [
  'It joins the review queue straight away. Significant ones stand out at the top.',
  'A psychologist reviews it, tags the development area and decides what should happen.',
  'If activities are recommended they are set for the student, and any note for you shows on their profile.',
];

/**
 * Same `ObservationForm` the parent app uses — `variant="teacher"` adds Level
 * and the learning-behaviour area.
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
            students={roster.students}
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
