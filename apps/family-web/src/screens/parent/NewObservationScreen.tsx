import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateObservation, useStudents, type NewObservation } from '@evolveiq/api-client';
import { ObservationForm } from '@evolveiq/domain';
import { ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

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
        title="Add an observation"
        subtitle="Write down something you noticed. There is no wrong thing to record."
      />

      <ObservationForm
        variant="parent"
        students={students.data ?? []}
        {...(defaultStudentId ? { defaultStudentId } : {})}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/parent/observations')}
        isSubmitting={createObservation.isPending}
        {...(submitError ? { submitError } : {})}
      />
    </div>
  );
}
