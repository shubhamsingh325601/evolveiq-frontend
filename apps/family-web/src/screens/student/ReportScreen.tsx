import { useHolisticIndex } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { HolisticReport } from '@evolveiq/domain';
import { ErrorState, LoadingState } from '@evolveiq/ui';

/** The student's own Holistic Report: the same component as their parent's, so the two never disagree. */
export function ReportScreen() {
  const { user } = useAuth();
  const holistic = useHolisticIndex(user?.id);

  if (holistic.isLoading || !user) return <LoadingState label="Working out your report" />;
  if (holistic.isError || !holistic.data) return <ErrorState onRetry={() => void holistic.refetch()} />;
  return (
    <HolisticReport
      studentName={user.fullName}
      index={holistic.data}
      back={{ to: '/student/progress', label: 'My progress' }}
    />
  );
}
