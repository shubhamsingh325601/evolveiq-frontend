import { useParams } from 'react-router-dom';
import { useHolisticIndex, useStudent } from '@evolveiq/api-client';
import { BackLink, firstNameOf, HolisticReport, possessive } from '@evolveiq/domain';
import { EmptyState, ErrorState, LoadingState, TrendingUp } from '@evolveiq/ui';

/** A parent's view of one child's Holistic Report Card. */
export function ChildReportScreen() {
  const { childId } = useParams<{ childId: string }>();
  const student = useStudent(childId);
  const holisticIndex = useHolisticIndex(childId);

  if (student.isLoading || holisticIndex.isLoading) return <LoadingState label="Loading the report" />;
  if (student.isError || !student.data || holisticIndex.isError) {
    return (
      <ErrorState
        title="We could not open that report"
        description="Go back to the dashboard and try again."
      />
    );
  }

  const dashboardPath = `/parent/children/${student.data.id}`;
  const firstName = firstNameOf(student.data.name);

  if (!holisticIndex.data) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink to={dashboardPath} className="self-start">
          {possessive(firstName)} dashboard
        </BackLink>
        <EmptyState
          icon={TrendingUp}
          title="No Holistic Report yet"
          description={`${possessive(firstName)} first report is put together once a term of observations and activities is in.`}
        />
      </div>
    );
  }

  return (
    <HolisticReport
      studentName={student.data.name}
      index={holisticIndex.data}
      back={{ to: dashboardPath, label: `${possessive(firstName)} dashboard` }}
    />
  );
}
