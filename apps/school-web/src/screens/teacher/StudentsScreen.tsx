import { Link, useNavigate } from 'react-router-dom';
import { useClasses, useObservations, useStudents } from '@evolveiq/api-client';
import { RecordsTable, ageFromDateOfBirth, type RecordsTableColumn } from '@evolveiq/domain';
import { Badge, buttonClasses, ErrorState, PageHeader } from '@evolveiq/ui';
import type { Student } from '@evolveiq/api-client';

export function StudentsScreen() {
  const students = useStudents();
  const classes = useClasses();
  const observations = useObservations();
  const navigate = useNavigate();

  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const classNameById = new Map((classes.data ?? []).map((group) => [group.id, group.name]));
  const pendingByStudent = new Map<string, number>();
  for (const observation of observations.data ?? []) {
    if (observation.status !== 'pending') continue;
    pendingByStudent.set(
      observation.studentId,
      (pendingByStudent.get(observation.studentId) ?? 0) + 1,
    );
  }

  const columns: RecordsTableColumn<Student>[] = [
    {
      id: 'name',
      header: 'Student',
      sortValue: (student) => student.name,
      cell: (student) => <span className="font-medium text-ink">{student.name}</span>,
    },
    {
      id: 'class',
      header: 'Class',
      sortValue: (student) => classNameById.get(student.classId) ?? '',
      cell: (student) => classNameById.get(student.classId) ?? 'Unassigned',
    },
    {
      id: 'age',
      header: 'Age',
      isSecondary: true,
      sortValue: (student) => ageFromDateOfBirth(student.dateOfBirth),
      cell: (student) => `${ageFromDateOfBirth(student.dateOfBirth)}`,
    },
    {
      id: 'growth-areas',
      header: 'Growth areas',
      isSecondary: true,
      sortValue: (student) => student.growthAreaIds.length,
      cell: (student) =>
        student.growthAreaIds.length === 0 ? (
          <span className="text-ink-faint">None open</span>
        ) : (
          <span className="tabular-nums">{student.growthAreaIds.length} of 5</span>
        ),
    },
    {
      id: 'pending',
      header: 'Awaiting review',
      align: 'right',
      sortValue: (student) => pendingByStudent.get(student.id) ?? 0,
      cell: (student) => {
        const count = pendingByStudent.get(student.id) ?? 0;
        return count === 0 ? (
          <span className="text-ink-faint">None</span>
        ) : (
          <Badge tone="pending">{count}</Badge>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My students"
        subtitle="Everyone in the classes you teach."
        actions={
          <Link to="/teacher/observations/new" className={buttonClasses({ size: 'sm' })}>
            New observation
          </Link>
        }
      />

      <RecordsTable
        caption="Students you teach"
        rows={students.data ?? []}
        columns={columns}
        getRowId={(student) => student.id}
        searchableText={(student) => student.name}
        searchPlaceholder="Search students"
        isLoading={students.isLoading}
        onRowClick={(student) => navigate(`/teacher/students/${student.id}`)}
        emptyTitle="No students assigned to you yet"
        emptyDescription="Your school admin links classes to your account."
      />
    </div>
  );
}
