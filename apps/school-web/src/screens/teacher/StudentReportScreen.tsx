import { useParams } from 'react-router-dom';
import { useHolisticIndex, useStudent } from '@evolveiq/api-client';
import { BackLink, HolisticReport } from '@evolveiq/domain';
import { EmptyState, ErrorState, LoadingState, TrendingUp } from '@evolveiq/ui';

/** The same Holistic Report Card the family sees, opened from a teacher's student profile. */
export function StudentReportScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const student = useStudent(studentId);
  const holisticIndex = useHolisticIndex(studentId);

  if (student.isLoading || holisticIndex.isLoading) return <LoadingState label="Loading the report" />;
  if (student.isError || !student.data || holisticIndex.isError) {
    return (
      <ErrorState
        title="We could not open that report"
        description="Go back to the student and try again."
      />
    );
  }

  const profilePath = `/teacher/students/${student.data.id}`;

  if (!holisticIndex.data) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink to={profilePath} className="self-start">
          {student.data.name}
        </BackLink>
        <EmptyState
          icon={TrendingUp}
          title="No Holistic Report yet"
          description="It is put together once a term of observations and activities is in."
        />
      </div>
    );
  }

  return (
    <HolisticReport
      studentName={student.data.name}
      index={holisticIndex.data}
      back={{ to: profilePath, label: student.data.name }}
    />
  );
}
