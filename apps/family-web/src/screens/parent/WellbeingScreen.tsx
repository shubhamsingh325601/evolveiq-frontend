import { useParams } from 'react-router-dom';
import { useChildren } from '@evolveiq/api-client';
import { firstNameOf, possessive } from '@evolveiq/domain';
import { ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';
import { WellbeingPanel } from '../../components/WellbeingPanel';

/** A parent's view of one child's wellbeing check-ins. */
export function WellbeingScreen() {
  const { childId } = useParams<{ childId: string }>();
  const children = useChildren();
  if (children.isLoading) return <LoadingState label="Loading" />;
  const child = (children.data ?? []).find((candidate) => candidate.id === childId);
  if (children.isError || !child) {
    return <ErrorState title="We could not open that page" description="Go back to your children and try again." />;
  }
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`${possessive(firstNameOf(child.fullName))} wellbeing`} subtitle="A short daily note, kept private to your family unless you choose to share it." />
      <WellbeingPanel studentId={child.id} studentName={child.fullName} audience="family" />
    </div>
  );
}
