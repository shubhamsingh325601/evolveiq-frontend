import { useHolisticIndex } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { BackLink, HolisticReport } from '@evolveiq/domain';
import { EmptyState, ErrorState, LoadingState, TrendingUp } from '@evolveiq/ui';

/** The student's own Holistic Report Card — the same report their parent sees. */
export function StudentReportScreen() {
  const { user } = useAuth();
  const studentId = user?.linkedStudentIds[0];
  const holisticIndex = useHolisticIndex(studentId);

  if (holisticIndex.isLoading) return <LoadingState label="Loading your report" />;
  if (holisticIndex.isError) return <ErrorState onRetry={() => void holisticIndex.refetch()} />;

  if (!user || !holisticIndex.data) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink to="/student/today" className="self-start">
          Home
        </BackLink>
        <EmptyState
          icon={TrendingUp}
          title="Your report is on its way"
          description="It is put together once you have a term of activities behind you."
        />
      </div>
    );
  }

  return (
    <HolisticReport
      studentName={user.name}
      index={holisticIndex.data}
      back={{ to: '/student/today', label: 'Home' }}
    />
  );
}
