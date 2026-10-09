import { Link, useNavigate } from 'react-router-dom';
import {
  useClasses,
  useHolisticIndexes,
  useObservations,
  useStudents,
  type HolisticIndex,
  type Student,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import {
  ageFromDateOfBirth,
  changeSinceLastYear,
  firstNameOf,
  greetingFor,
  RecordsTable,
  type RecordsTableColumn,
} from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  buttonClasses,
  ClipboardList,
  ErrorState,
  Inbox,
  PageHeader,
  Plus,
  Sprout,
  StatTile,
  TrendingUp,
  UsersRound,
} from '@evolveiq/ui';
import { EhiMeter } from '../../components/EhiMeter';
import { GrowthAreaChips } from '../../components/GrowthAreaChips';

const NAME_LIST = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

/** A teacher's home: how their classes are doing, then everyone they teach. */
export function StudentsScreen() {
  const { user } = useAuth();
  const students = useStudents();
  const classes = useClasses();
  const observations = useObservations();
  const roster = students.data ?? [];
  const indexes = useHolisticIndexes(roster.map((student) => student.id));
  const navigate = useNavigate();

  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const classNameById = new Map((classes.data ?? []).map((group) => [group.id, group.name]));
  const myClassNames = (classes.data ?? [])
    .filter((group) => group.teacherId === user?.id)
    .map((group) => group.name);

  const pendingByStudent = new Map<string, number>();
  for (const observation of observations.data ?? []) {
    if (observation.status !== 'pending') continue;
    pendingByStudent.set(
      observation.studentId,
      (pendingByStudent.get(observation.studentId) ?? 0) + 1,
    );
  }
  const pendingTotal = [...pendingByStudent.values()].reduce((sum, count) => sum + count, 0);
  const openAreas = roster.reduce((sum, student) => sum + student.growthAreaIds.length, 0);
  const studentsWithAreas = roster.filter((student) => student.growthAreaIds.length > 0).length;

  const rosterIndexes = roster
    .map((student) => indexes.byStudentId.get(student.id))
    .filter((index): index is HolisticIndex => Boolean(index));
  const classEhi = average(rosterIndexes.map((index) => index.score));
  const classChange = average(
    rosterIndexes
      .map((index) => changeSinceLastYear(index))
      .filter((change): change is number => change !== null),
  );

  const columns: RecordsTableColumn<Student>[] = [
    {
      id: 'name',
      header: 'Student',
      sortValue: (student) => student.name,
      cell: (student) => (
        <span className="flex items-center gap-3">
          <Avatar name={student.name} />
          <span className="min-w-0">
            <span className="block font-bold text-ink">{student.name}</span>
            <span className="block text-xs text-ink-muted">
              {classNameById.get(student.classId) ?? 'No class'}, age{' '}
              {ageFromDateOfBirth(student.dateOfBirth)}
            </span>
          </span>
        </span>
      ),
    },
    {
      id: 'growth-areas',
      header: 'Growth areas',
      isSecondary: true,
      sortValue: (student) => student.growthAreaIds.length,
      cell: (student) => <GrowthAreaChips studentId={student.id} count={student.growthAreaIds.length} />,
    },
    {
      id: 'ehi',
      header: 'EHI',
      sortValue: (student) => indexes.byStudentId.get(student.id)?.score ?? -1,
      cell: (student) => <EhiMeter index={indexes.byStudentId.get(student.id)} />,
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

  const greeting = user ? `${greetingFor()}, ${firstNameOf(user.name)}.` : `${greetingFor()}.`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My students"
        subtitle={
          myClassNames.length > 0
            ? `${greeting} Here is how ${NAME_LIST.format(myClassNames)} are doing.`
            : greeting
        }
        actions={
          <>
            <Link
              to="/teacher/assign"
              className={buttonClasses({ variant: 'secondary', size: 'sm' })}
            >
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
          value={roster.length}
          detail={myClassNames.length > 0 ? `In ${NAME_LIST.format(myClassNames)}` : 'In your classes'}
        />
        <StatTile
          icon={Inbox}
          tone="honey"
          label="Awaiting review"
          value={pendingTotal}
          detail="Observations with the psychologist"
        />
        <StatTile
          icon={Sprout}
          tone="jade"
          label="Growth areas open"
          value={openAreas}
          detail={`Across ${studentsWithAreas} ${studentsWithAreas === 1 ? 'student' : 'students'}`}
        />
        <StatTile
          icon={TrendingUp}
          tone="night"
          label="Class EHI"
          value={classEhi ?? '–'}
          detail={
            classChange && classChange > 0
              ? `Up ${classChange} on last year, on average`
              : 'EvolvIQ Holistic Index, on average'
          }
        />
      </div>

      <RecordsTable
        caption="Students you teach"
        rows={roster}
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
