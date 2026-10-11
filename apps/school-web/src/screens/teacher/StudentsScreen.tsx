import { Link, useNavigate } from 'react-router-dom';
import {
  useClassRoster,
  useGrowthAreasForStudents,
  useTeacherObservations,
  type RosterStudent,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { firstNameOf, greetingFor, RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  buttonClasses,
  Check,
  ClipboardList,
  ErrorState,
  Inbox,
  PageHeader,
  Plus,
  Sprout,
  StatTile,
  UsersRound,
} from '@evolveiq/ui';
import { GrowthAreaChips } from '../../components/GrowthAreaChips';

const NAME_LIST = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });

/** A teacher's home: how their classes are doing, then everyone they teach. */
export function StudentsScreen() {
  const { user } = useAuth();
  const roster = useClassRoster();
  const ownObservations = useTeacherObservations();
  const growthAreas = useGrowthAreasForStudents(roster.students.map((student) => student.id));
  const navigate = useNavigate();

  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  const classNames = roster.classes.map((detail) => detail.class.name);
  const pendingByStudent = new Map<string, number>();
  for (const observation of ownObservations.data ?? []) {
    if (observation.status !== 'pending') continue;
    pendingByStudent.set(observation.studentId, (pendingByStudent.get(observation.studentId) ?? 0) + 1);
  }
  const pendingTotal = [...pendingByStudent.values()].reduce((sum, count) => sum + count, 0);
  const reviewedTotal = (ownObservations.data ?? []).filter((observation) => observation.status === 'reviewed').length;
  const areaCounts = roster.students.map((student) => growthAreas.get(student.id)?.length ?? 0);
  const openAreas = areaCounts.reduce((sum, count) => sum + count, 0);
  const studentsWithAreas = areaCounts.filter((count) => count > 0).length;

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
      id: 'growth-areas',
      header: 'Growth areas',
      isSecondary: true,
      sortValue: (student) => growthAreas.get(student.id)?.length ?? 0,
      cell: (student) => <GrowthAreaChips growthAreas={growthAreas.get(student.id)} />,
    },
    {
      id: 'pending',
      header: 'Awaiting review',
      align: 'right',
      sortValue: (student) => pendingByStudent.get(student.id) ?? 0,
      cell: (student) => {
        const count = pendingByStudent.get(student.id) ?? 0;
        return count === 0 ? <span className="text-ink-faint">None</span> : <Badge tone="pending">{count}</Badge>;
      },
    },
  ];

  const greeting = user ? `${greetingFor()}, ${firstNameOf(user.fullName)}.` : `${greetingFor()}.`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My students"
        subtitle={
          classNames.length > 0 ? `${greeting} Here is how ${NAME_LIST.format(classNames)} are doing.` : greeting
        }
        actions={
          <>
            <Link to="/teacher/assign" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <ClipboardList />
              Assign an activity
            </Link>
            <Link to="/teacher/observations/new" className={buttonClasses({ size: 'sm' })}>
              <Plus />
              New observation
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile
          icon={UsersRound}
          label="Students"
          value={roster.students.length}
          detail={classNames.length > 0 ? `In ${NAME_LIST.format(classNames)}` : 'In your classes'}
        />
        <StatTile
          icon={Inbox}
          tone="honey"
          label="Awaiting review"
          value={pendingTotal}
          detail="Your observations with the psychologist"
        />
        <StatTile icon={Check} tone="lilac" label="Reviewed" value={reviewedTotal} detail="Your observations closed" />
        <StatTile
          icon={Sprout}
          tone="jade"
          label="Growth areas open"
          value={openAreas}
          detail={`Across ${studentsWithAreas} ${studentsWithAreas === 1 ? 'student' : 'students'}`}
        />
      </div>

      <RecordsTable
        caption="Students you teach"
        rows={roster.students}
        columns={columns}
        getRowId={(student) => student.id}
        searchableText={(student) => `${student.fullName} ${student.className}`}
        searchPlaceholder="Search students"
        isLoading={roster.isLoading}
        onRowClick={(student) => navigate(`/teacher/students/${student.id}`)}
        emptyTitle="No students assigned to you yet"
        emptyDescription="Your school admin adds you to classes."
      />
    </div>
  );
}
