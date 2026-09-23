import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateObservation, useStudents, type NewObservation } from '@evolveiq/api-client';
import { ObservationForm } from '@evolveiq/domain';
import { ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

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
        title="New observation"
        subtitle="What you record goes to the psychologist's review queue."
      />

      <ObservationForm
        variant="teacher"
        students={students.data ?? []}
        {...(defaultStudentId ? { defaultStudentId } : {})}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/teacher/students')}
        isSubmitting={createObservation.isPending}
        {...(submitError ? { submitError } : {})}
      />
    </div>
  );
}
