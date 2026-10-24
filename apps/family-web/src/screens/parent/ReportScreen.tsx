import { useParams } from 'react-router-dom';
import { useChildren, useHolisticIndex } from '@evolveiq/api-client';
import { firstNameOf, HolisticReport, possessive } from '@evolveiq/domain';
import { ErrorState, LoadingState } from '@evolveiq/ui';

/** A child's Holistic Report, for their parent. */
export function ReportScreen() {
  const { childId } = useParams<{ childId: string }>();
  const children = useChildren();
  const holistic = useHolisticIndex(childId);

  if (children.isLoading || holistic.isLoading) return <LoadingState label="Working out the report" />;
  const child = (children.data ?? []).find((candidate) => candidate.id === childId);
  if (children.isError || holistic.isError || !child || !holistic.data) {
    return <ErrorState title="We could not open that report" description="Go back to your children and try again." />;
  }

  return (
    <HolisticReport
      studentName={child.fullName}
      index={holistic.data}
      back={{ to: `/parent/children/${child.id}`, label: `${possessive(firstNameOf(child.fullName))} dashboard` }}
    />
  );
}
