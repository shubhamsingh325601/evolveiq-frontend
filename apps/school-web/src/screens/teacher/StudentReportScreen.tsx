import { useParams } from 'react-router-dom';
import { useClassRoster, useHolisticIndex } from '@evolveiq/api-client';
import { HolisticReport } from '@evolveiq/domain';
import { ErrorState, LoadingState } from '@evolveiq/ui';

/** One student's NEP Holistic Report Card, for their teacher. */
export function StudentReportScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const roster = useClassRoster();
  const holistic = useHolisticIndex(studentId);

  if (roster.isLoading || holistic.isLoading) return <LoadingState label="Working out the report" />;
  const student = roster.students.find((candidate) => candidate.id === studentId);
  if (roster.isError || holistic.isError || !student || !holistic.data) {
    return <ErrorState title="We could not open that report" description="Go back to the reports and try again." />;
  }

  return (
    <HolisticReport
      studentName={student.fullName}
      index={holistic.data}
      back={{ to: '/teacher/reports', label: 'NEP reports' }}
    />
  );
}
