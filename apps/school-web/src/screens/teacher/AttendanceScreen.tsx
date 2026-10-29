import { useId, useState } from 'react';
import {
  addDays,
  businessDate,
  isApiError,
  monthRange,
  useClassAttendance,
  useClassesHealth,
  useClassRoster,
  useMarkAttendance,
  type AttendanceStatus,
  type ClassAttendance,
  type HealthProfile,
} from '@evolveiq/api-client';
import {
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUSES,
  AttendanceMeter,
  attendanceSummary,
  CareFlags,
  formatDayShort,
  formatMonth,
  RecordsTable,
  type RecordsTableColumn,
} from '@evolveiq/domain';
import {
  Avatar,
  Button,
  Card,
  Check,
  ClipboardCheck,
  cn,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  PageHeader,
  Select,
} from '@evolveiq/ui';
import { useClassChoice } from '../../useClassChoice';

/** How far back a register can be corrected (the backend's rule). */
const BACKFILL_DAYS = 30;
const TIME = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

const STATUS_CLASSES: Record<AttendanceStatus, string> = {
  present: 'peer-checked:bg-jade-500 peer-checked:text-white peer-checked:ring-jade-500',
  late: 'peer-checked:bg-honey-400 peer-checked:text-night peer-checked:ring-honey-400',
  absent: 'peer-checked:bg-coral-500 peer-checked:text-white peer-checked:ring-coral-500',
};

function StatusPicker({ name, value, onChange }: { name: string; value: AttendanceStatus; onChange: (status: AttendanceStatus) => void }) {
  const group = useId();
  return (
    <div role="radiogroup" aria-label={name} className="flex gap-1.5">
      {ATTENDANCE_STATUSES.map((status) => (
        <label key={status} className="cursor-pointer">
          <input
            type="radio"
            name={group}
            value={status}
            checked={value === status}
            onChange={() => onChange(status)}
            className="peer sr-only"
          />
          <span
            className={cn(
              'flex h-9 min-w-[4.5rem] items-center justify-center rounded-xl bg-white px-3 text-xs font-bold text-ink-muted ring-1 ring-inset ring-line transition-colors',
              'peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-iris-500',
              STATUS_CLASSES[status],
            )}
          >
            {ATTENDANCE_STATUS_LABELS[status]}
          </span>
        </label>
      ))}
    </div>
  );
}

interface RegisterProps {
  classId: string;
  day: string;
  register: ClassAttendance;
  care: Map<string, HealthProfile>;
}

/** One class's register for one day. Not taken yet, everyone starts present. */
function Register({ classId, day, register, care }: RegisterProps) {
  const mark = useMarkAttendance(classId);
  const headingId = useId();
  const [marks, setMarks] = useState<Record<string, AttendanceStatus>>(() =>
    Object.fromEntries(register.students.map((student) => [student.id, student.records[day] ?? 'present'])),
  );
  const taken = register.days.find((entry) => entry.day === day);
  const counts = ATTENDANCE_STATUSES.map((status) => [status, Object.values(marks).filter((value) => value === status).length] as const);

  const save = () =>
    mark.mutate({ day, records: register.students.map((student) => ({ studentId: student.id, status: marks[student.id] ?? 'present' })) });

  if (register.students.length === 0) {
    return <EmptyState icon={ClipboardCheck} title="No students in this class yet" description="Your school admin places students in classes." />;
  }

  return (
    <Card as="section" aria-labelledby={headingId} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft px-5 py-4">
        <div>
          <h2 id={headingId} className="text-lg font-black tracking-tight text-ink">
            Register for {formatDayShort(day)}
          </h2>
          <p className="text-sm font-medium text-ink-muted">
            {taken
              ? `Taken by ${taken.markedBy?.fullName ?? 'a teacher'} at ${TIME.format(new Date(taken.markedAt))}. Change anything and save again.`
              : 'Not taken yet. Everyone starts as present: mark who is late or away.'}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={Check}
          onClick={() => setMarks(Object.fromEntries(register.students.map((student) => [student.id, 'present'])))}
        >
          Mark everyone present
        </Button>
      </div>
      <ul className="divide-y divide-line-soft">
        {register.students.map((student) => (
          <li key={student.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={student.fullName} size="sm" />
              <span className="min-w-0">
                <span className="block font-bold text-ink">{student.fullName}</span>
                {care.get(student.id)?.conditions.length ? (
                  <CareFlags conditions={care.get(student.id)?.conditions} className="mt-0.5" />
                ) : null}
              </span>
            </span>
            <StatusPicker
              name={student.fullName}
              value={marks[student.id] ?? 'present'}
              onChange={(status) => setMarks((current) => ({ ...current, [student.id]: status }))}
            />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft bg-surface-sunken px-5 py-4">
        <p className="text-sm font-semibold text-ink-muted">
          {counts.map(([status, count]) => `${count} ${ATTENDANCE_STATUS_LABELS[status].toLowerCase()}`).join(' · ')}
        </p>
        <Button icon={ClipboardCheck} isLoading={mark.isPending} onClick={save}>
          {taken ? 'Save changes' : 'Save register'}
        </Button>
      </div>
      {mark.isSuccess ? (
        <p role="status" className="px-5 pb-4 text-sm font-semibold text-jade-700">
          Saved. The register for {formatDayShort(day)} is in.
        </p>
      ) : null}
      {mark.isError ? (
        <p role="alert" className="px-5 pb-4 text-sm font-semibold text-coral-700">
          {isApiError(mark.error) ? mark.error.message : 'We could not save the register. Try again.'}
        </p>
      ) : null}
    </Card>
  );
}

/**
 * Taking attendance (client feedback, 29 Oct 2026): a teacher picks one of
 * their classes and a day — today, or a correction up to 30 days back — and
 * marks each student present, late or absent. The month's tally below is what
 * the roster's "18/26 days" is made of.
 */
export function AttendanceScreen() {
  const roster = useClassRoster();
  const classIds = roster.classes.map((detail) => detail.class.id);
  const [classId, setClassId] = useClassChoice(classIds, classIds[0]);
  const today = businessDate();
  const [day, setDay] = useState(today);
  const register = useClassAttendance(classId, { from: day, to: day });
  const month = monthRange(day.slice(0, 7), today);
  const monthly = useClassAttendance(classId, month);
  const health = useClassesHealth(classId ? [classId] : []);

  if (roster.isLoading) return <LoadingState label="Loading your classes" />;
  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;
  if (roster.classes.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Attendance" subtitle="Take the register for your classes." />
        <EmptyState icon={ClipboardCheck} title="You are not in a class yet" description="Your school admin adds you to classes." />
      </div>
    );
  }

  const columns: RecordsTableColumn<ClassAttendance['students'][number]>[] = [
    { id: 'name', header: 'Student', sortValue: (s) => s.fullName, cell: (s) => <span className="font-bold text-ink">{s.fullName}</span> },
    {
      id: 'days',
      header: 'Attendance',
      sortValue: (s) => attendanceSummary(s).share ?? -1,
      cell: (s) => {
        const { attended, recorded } = attendanceSummary(s);
        return <AttendanceMeter attended={attended} recorded={recorded} period={formatMonth(month.from.slice(0, 7))} />;
      },
    },
    { id: 'present', header: 'Present', align: 'right', sortValue: (s) => s.present, cell: (s) => s.present },
    { id: 'late', header: 'Late', align: 'right', sortValue: (s) => s.late, cell: (s) => s.late },
    { id: 'absent', header: 'Absent', align: 'right', sortValue: (s) => s.absent, cell: (s) => s.absent },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Attendance" subtitle="Take today’s register, or correct one from the last 30 days." />

      <div className="flex flex-wrap items-end gap-4">
        <FormField label="Class" className="w-full max-w-xs">
          <Select value={classId} onChange={(event) => setClassId(event.target.value)}>
            {roster.classes.map((detail) => (
              <option key={detail.class.id} value={detail.class.id}>
                {detail.class.name} · {detail.students.length} {detail.students.length === 1 ? 'student' : 'students'}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Day" className="w-full max-w-[12rem]">
          <Input type="date" value={day} min={addDays(today, -BACKFILL_DAYS)} max={today} onChange={(event) => event.target.value && setDay(event.target.value)} />
        </FormField>
        {day !== today ? (
          <Button variant="quiet" size="sm" onClick={() => setDay(today)}>
            Back to today
          </Button>
        ) : null}
      </div>

      {register.isLoading ? <LoadingState label="Loading the register" /> : null}
      {register.isError ? <ErrorState onRetry={() => void register.refetch()} /> : null}
      {register.data ? (
        <Register key={`${classId}:${day}`} classId={classId} day={day} register={register.data} care={health.byStudentId} />
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-black tracking-tight text-ink">
          {formatMonth(month.from.slice(0, 7))} so far
          {monthly.data ? (
            <span className="ml-2 text-sm font-semibold text-ink-muted">
              {monthly.data.days.length} {monthly.data.days.length === 1 ? 'school day' : 'school days'} recorded
            </span>
          ) : null}
        </h2>
        <RecordsTable
          caption={`Attendance in ${formatMonth(month.from.slice(0, 7))}`}
          rows={monthly.data?.students ?? []}
          columns={columns}
          getRowId={(s) => s.id}
          isLoading={monthly.isLoading}
          emptyTitle="No students in this class yet"
        />
      </section>
    </div>
  );
}
