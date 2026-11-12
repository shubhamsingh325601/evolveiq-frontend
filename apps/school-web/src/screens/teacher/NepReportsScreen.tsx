import { Link, useNavigate } from 'react-router-dom';
import { FEATURES, useClassRoster, useHolisticIndexes, type RosterStudent } from '@evolveiq/api-client';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { Avatar, buttonClasses, ChevronRight, EmptyState, ErrorState, FileText, PageHeader } from '@evolveiq/ui';

/**
 * NEP reports: each student's Holistic Report Card (the NEP 2020 holistic
 * progress card), one click from the roster. Teachers see the same report the
 * family sees.
 */
export function NepReportsScreen() {
  const roster = useClassRoster();
  const indexes = useHolisticIndexes(FEATURES.holisticIndex ? roster.students.map((student) => student.id) : []);
  const navigate = useNavigate();

  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  if (!FEATURES.holisticIndex) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="NEP reports" />
        <EmptyState
          icon={FileText}
          title="Reports are not available yet"
          description="They appear here once the Holistic Index is switched on."
        />
      </div>
    );
  }

  const columns: RecordsTableColumn<RosterStudent>[] = [
    {
      id: 'name',
      header: 'Student',
      sortValue: (student) => student.fullName,
      cell: (student) => (
        <span className="flex items-center gap-3">
          <Avatar name={student.fullName} />
          <span className="min-w-0">
            <span className="block font-bold text-ink">{student.fullName}</span>
            <span className="block text-xs text-ink-muted">Class {student.className}</span>
          </span>
        </span>
      ),
    },
    {
      id: 'score',
      header: 'EHI',
      sortValue: (student) => indexes.byStudent.get(student.id)?.score ?? -1,
      cell: (student) => {
        const score = indexes.byStudent.get(student.id)?.score;
        return score === undefined ? (
          <span className="text-ink-faint">{indexes.isLoading ? '…' : 'Not ready'}</span>
        ) : (
          <span className="font-black text-iris-600">{score}</span>
        );
      },
    },
    {
      id: 'report',
      header: 'Report',
      align: 'right',
      cell: (student) => (
        <Link
          to={`/teacher/reports/${student.id}`}
          onClick={(event) => event.stopPropagation()}
          className={buttonClasses({ variant: 'secondary', size: 'sm' })}
        >
          View report
          <ChevronRight />
        </Link>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="NEP reports" subtitle="Each student’s Holistic Report Card, the same one their family sees." />
      <RecordsTable
        caption="NEP reports for the students you teach"
        rows={roster.students}
        columns={columns}
        getRowId={(student) => student.id}
        searchableText={(student) => `${student.fullName} ${student.className}`}
        searchPlaceholder="Search students"
        isLoading={roster.isLoading}
        onRowClick={(student) => navigate(`/teacher/reports/${student.id}`)}
        emptyTitle="No students assigned to you yet"
        emptyDescription="Your school admin adds you to classes."
      />
    </div>
  );
}
