import { useHolisticIndex } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { firstNameOf, FutureExplorer } from '@evolveiq/domain';
import { ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/** Future Explorer for the student: ideas that start from their own strengths. */
export function ExploreScreen() {
  const { user } = useAuth();
  const holistic = useHolisticIndex(user?.id);
  if (holistic.isLoading || !user) return <LoadingState label="Finding ideas" />;
  if (holistic.isError || !holistic.data) return <ErrorState onRetry={() => void holistic.refetch()} />;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Explore" subtitle="Things you could try, and where they might lead." />
      <FutureExplorer strengths={holistic.data.strengths} name={firstNameOf(user.fullName)} audience="student" />
    </div>
  );
}
