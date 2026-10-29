import { Link, useNavigate } from 'react-router-dom';
import {
  businessDate,
  monthRange,
  useClassesAttendance,
  useClassesHealth,
  useClassRoster,
  useGrowthAreasForStudents,
  useStarsForStudents,
  useTeacherObservations,
  type RosterStudent,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import {
  AttendanceMeter,
  attendanceSummary,
  CareFlags,
  firstNameOf,
  formatMonth,
  greetingFor,
  RecordsTable,
  type RecordsTableColumn,
} from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  buttonClasses,
  ClipboardCheck,
  ClipboardList,
  ErrorState,
  FormField,
  HeartPulse,
  Inbox,
  PageHeader,
  Plus,
  Select,
  Star,
  StatTile,
  UsersRound,
} from '@evolveiq/ui';
import { GrowthAreaChips } from '../../components/GrowthAreaChips';
import { ALL_CLASSES, useClassChoice } from '../../useClassChoice';

const NAME_LIST = new Intl.ListFormat('en-GB', { style: 'long', type: 'conjunction' });

/**
 * A teacher's home: how their classes are doing, then everyone they teach. A
 * drop-down narrows it to one class, and each student shows their days in this
 * month ("18/26 days") and any care needs their family or the school office
 * recorded (client feedback, 29 Oct 2026).
 */
export function StudentsScreen() {
  const { user } = useAuth();
  const roster = useClassRoster();
  const classIds = roster.classes.map((detail) => detail.class.id);
  const [classChoice, setClassChoice] = useClassChoice(classIds);
  const ownObservations = useTeacherObservations();
  const range = monthRange();
  const attendance = useClassesAttendance(classIds, range);
  const health = useClassesHealth(classIds);
  const navigate = useNavigate();

  const shownClasses = classChoice === ALL_CLASSES ? roster.classes : roster.classes.filter((detail) => detail.class.id === classChoice);
  const students = classChoice === ALL_CLASSES ? roster.students : roster.students.filter((student) => student.classId === classChoice);
  const studentIds = students.map((student) => student.id);
  const growthAreas = useGrowthAreasForStudents(studentIds);
  const stars = useStarsForStudents(studentIds);

  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  const classNames = shownClasses.map((detail) => detail.class.name);
  const shownIds = new Set(studentIds);
  const own = (ownObservations.data ?? []).filter((observation) => shownIds.has(observation.studentId));
  const pendingByStudent = new Map<string, number>();
  for (const observation of own) {
    if (observation.status !== 'pending') continue;
    pendingByStudent.set(observation.studentId, (pendingByStudent.get(observation.studentId) ?? 0) + 1);
  }
  const pendingTotal = [...pendingByStudent.values()].reduce((sum, count) => sum + count, 0);
  const reviewedTotal = own.filter((observation) => observation.status === 'reviewed').length;
  const starsGiven = own.filter((observation) => observation.tone === 'positive').length;
  const starCountOf = (student: RosterStudent) => stars.get(student.id)?.length ?? 0;
  const summaryOf = (student: RosterStudent) => attendanceSummary(attendance.byStudentId.get(student.id));
  const careOf = (student: RosterStudent) => health.byStudentId.get(student.id);
  const needsCare = students.filter((student) => (careOf(student)?.conditions.length ?? 0) > 0).length;

  const today = businessDate();
  const todaysRecords = students.flatMap((student) => {
    const status = attendance.byStudentId.get(student.id)?.records[today];
    return status ? [status] : [];
  });
  const inToday = todaysRecords.filter((status) => status !== 'absent').length;
  const attendancePath = `/teacher/attendance${classChoice === ALL_CLASSES ? '' : `?class=${classChoice}`}`;

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
      id: 'attendance',
      header: 'Attendance',
      sortValue: (student) => summaryOf(student).share ?? -1,
      cell: (student) => {
        const { attended, recorded } = summaryOf(student);
        return <AttendanceMeter attended={attended} recorded={recorded} period="this month" />;
      },
    },
    {
      id: 'care',
      header: 'Care needs',
      sortValue: (student) => careOf(student)?.conditions.length ?? 0,
      cell: (student) => <CareFlags conditions={careOf(student)?.conditions} hasNotes={Boolean(careOf(student)?.careNotes)} />,
    },
    {
      id: 'stars',
      header: 'Stars',
      sortValue: starCountOf,
      cell: (student) => {
        const count = starCountOf(student);
        return count === 0 ? (
          <span className="text-ink-faint">None yet</span>
        ) : (
          <Badge tone="star" icon={Star}>
            {count}
            <span className="sr-only"> {count === 1 ? 'star' : 'stars'}</span>
          </Badge>
        );
      },
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
        subtitle={classNames.length > 0 ? `${greeting} Here is how ${NAME_LIST.format(classNames)} are doing.` : greeting}
        actions={
          <>
            <Link to={attendancePath} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <ClipboardCheck />
              Take attendance
            </Link>
            <Link to="/teacher/assign" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <ClipboardList />
              Assign an activity
            </Link>
            <Link to="/teacher/observations/new?tone=positive" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <Star />
              Give a star
            </Link>
            <Link to="/teacher/observations/new" className={buttonClasses({ size: 'sm' })}>
              <Plus />
              New observation
            </Link>
          </>
        }
      />

      {roster.classes.length > 1 ? (
        <FormField label="Class" className="max-w-xs">
          <Select value={classChoice} onChange={(event) => setClassChoice(event.target.value)}>
            <option value={ALL_CLASSES}>All my classes · {roster.students.length} students</option>
            {roster.classes.map((detail) => (
              <option key={detail.class.id} value={detail.class.id}>
                {detail.class.name} · {detail.students.length} {detail.students.length === 1 ? 'student' : 'students'}
              </option>
            ))}
          </Select>
        </FormField>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <StatTile
          className="col-span-2 sm:col-span-1"
          icon={UsersRound}
          label="Students"
          value={students.length}
          detail={classNames.length > 0 ? `In ${NAME_LIST.format(classNames)}` : 'In your classes'}
        />
        <StatTile
          icon={ClipboardCheck}
          tone="jade"
          label="In today"
          value={todaysRecords.length > 0 ? `${inToday} of ${students.length}` : '–'}
          detail={todaysRecords.length > 0 ? `${todaysRecords.length - inToday} away` : 'Register not taken yet'}
        />
        <StatTile
          icon={HeartPulse}
          tone="coral"
          label="Special care"
          value={needsCare}
          detail="Health needs on record"
        />
        <StatTile icon={Star} tone="star" label="Stars given" value={starsGiven} detail="By you, for good things noticed" />
        <StatTile
          icon={Inbox}
          tone="honey"
          label="Awaiting review"
          value={pendingTotal}
          detail={`Your concerns with the counsellor · ${reviewedTotal} reviewed`}
        />
      </div>

      <RecordsTable
        caption="Students you teach"
        rows={students}
        columns={columns}
        getRowId={(student) => student.id}
        searchableText={(student) => `${student.fullName} ${student.className}`}
        searchPlaceholder="Search students"
        isLoading={roster.isLoading}
        onRowClick={(student) => navigate(`/teacher/students/${student.id}`)}
        emptyTitle="No students assigned to you yet"
        emptyDescription="Your school admin adds you to classes."
      />
      {attendance.byStudentId.size > 0 ? (
        <p className="-mt-4 text-xs font-medium text-ink-faint">
          Attendance is {formatMonth(range.from.slice(0, 7))} so far: days present or late, out of the days the register was taken. Under 75%
          shows in amber.
        </p>
      ) : null}
    </div>
  );
}
