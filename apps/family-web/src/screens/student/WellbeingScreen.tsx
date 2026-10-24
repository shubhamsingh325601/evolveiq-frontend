import { useAuth } from '@evolveiq/auth';
import { LoadingState, PageHeader } from '@evolveiq/ui';
import { WellbeingPanel } from '../../components/WellbeingPanel';

/** The student's own daily check-in. */
export function WellbeingScreen() {
  const { user } = useAuth();
  if (!user) return <LoadingState label="Loading" />;
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="How I feel" subtitle="A quick check-in, just for you." />
      <WellbeingPanel studentId={user.id} studentName={user.fullName} audience="student" />
    </div>
  );
}
