import { Link, useParams } from 'react-router-dom';
import {
  businessDate,
  lastSevenDays,
  MAX_GROWTH_AREAS,
  useActivities,
  useClassRoster,
  useGrowthAreas,
  useStreak,
  useStudentAssignments,
  useTeacherObservations,
} from '@evolveiq/api-client';
import {
  BackLink,
  describeAnswer,
  GrowthAreaList,
  ObservationEntry,
  relativeDayPhrase,
  StreakIndicator,
} from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  buttonClasses,
  Card,
  ClipboardList,
  EmptyState,
  ErrorState,
  Flame,
  LayoutGrid,
  LoadingState,
  NotebookPen,
  Plus,
  Quote,
  RuledList,
  RuledListItem,
  SectionTitle,
  Sprout,
} from '@evolveiq/ui';

/**
 * A teacher's view of one student of their classes: up to five growth areas,
 * their streak, every activity set for them with their answers, and the
 * observations this teacher has written about them — with the psychologist's
 * note back, once reviewed.
 */
export function StudentProfileScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const roster = useClassRoster();
  const growthAreas = useGrowthAreas(studentId);
  const streak = useStreak(studentId);
  const assignments = useStudentAssignments(studentId);
  const activities = useActivities();
  const ownObservations = useTeacherObservations();

  if (roster.isLoading) return <LoadingState label="Loading the student" />;
  const student = roster.students.find((candidate) => candidate.id === studentId);
  if (roster.isError || !student) {
    return (
      <ErrorState title="We could not open that student" description="Go back to your students and try again." />
    );
  }

  const contentById = new Map((activities.data ?? []).map((activity) => [activity.id, activity.content]));
  const entries = (ownObservations.data ?? []).filter((observation) => observation.studentId === student.id);
  const openGrowthAreas = growthAreas.data ?? [];
  const set = assignments.data ?? [];
  const finishedDays = set.flatMap((assignment) =>
    assignment.completion ? [businessDate(assignment.completion.completedAt)] : [],
  );
  const assignPath = `/teacher/assign?studentId=${student.id}`;

  return (
    <div className="flex flex-col gap-8">
      <BackLink to="/teacher/students" className="self-start">
        My students
      </BackLink>

      <Card isPlayful className="relative isolate overflow-hidden p-6 sm:p-8">
        <span
          aria-hidden="true"
          className="absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-gradient-to-br from-iris-100 to-lilac-100 blur-2xl"
        />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-5">
            <Avatar name={student.fullName} size="xl" className="size-20 text-2xl" />
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">{student.fullName}</h1>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                <li>
                  <Badge icon={LayoutGrid}>Class {student.className}</Badge>
                </li>
                <li>
                  <Badge tone="growth" icon={Sprout}>
                    {openGrowthAreas.length} of {MAX_GROWTH_AREAS} growth areas
                  </Badge>
                </li>
                {streak.data ? (
                  <li>
                    <Badge icon={Flame}>
                      {streak.data.days} {streak.data.days === 1 ? 'day' : 'days'} in a row
                    </Badge>
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={assignPath} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <ClipboardList />
              Assign an activity
            </Link>
            <Link to={`/teacher/observations/new?studentId=${student.id}`} className={buttonClasses({ size: 'sm' })}>
              <Plus />
              New observation
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <section>
            <SectionTitle
              icon={Sprout}
              iconClassName="text-jade-500"
              action={
                <p className="text-sm font-semibold tabular-nums text-ink-muted">
                  {openGrowthAreas.length} of {MAX_GROWTH_AREAS}
                </p>
              }
            >
              Growth areas
            </SectionTitle>
            {openGrowthAreas.length === 0 && !growthAreas.isLoading ? (
              <EmptyState
                className="mt-4"
                icon={Sprout}
                title="No growth areas yet"
                description="A psychologist opens one when they assign activities after a review."
              />
            ) : (
              <GrowthAreaList className="mt-4" growthAreas={openGrowthAreas} />
            )}
          </section>

          <section>
            <SectionTitle icon={ClipboardList}>Activity progress</SectionTitle>
            {streak.data ? (
              <Card className="mt-4 p-5">
                <StreakIndicator days={streak.data.days} lastSevenDays={lastSevenDays(finishedDays, businessDate())} />
              </Card>
            ) : null}
            {assignments.isLoading ? <LoadingState /> : null}
            {set.length === 0 && !assignments.isLoading ? (
              <EmptyState
                className="mt-4"
                icon={ClipboardList}
                title="Nothing assigned yet"
                description="Assign an activity and its progress will show here."
                action={
                  <Link to={assignPath} className={buttonClasses({ size: 'sm' })}>
                    Assign an activity
                  </Link>
                }
              />
            ) : (
              <Card className="mt-4 overflow-hidden">
                <ul className="divide-y divide-line-soft">
                  {set.map((assignment) => (
                    <li key={assignment.id} className="flex flex-col gap-2 px-5 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-ink">{assignment.activity.title}</p>
                          <p className="mt-0.5 text-sm text-ink-muted">
                            {assignment.source === 'recommended'
                              ? `Recommended by ${assignment.assignedBy.fullName}`
                              : `Set by ${assignment.assignedBy.fullName}`}
                            , {relativeDayPhrase(assignment.assignedAt)}
                          </p>
                        </div>
                        <Badge tone={assignment.completion ? 'growth' : 'neutral'}>
                          {assignment.completion ? 'Done' : 'To do'}
                        </Badge>
                      </div>
                      {assignment.completion ? (
                        <Quote
                          attribution={`${student.fullName.split(' ')[0]}, ${relativeDayPhrase(assignment.completion.completedAt)}`}
                        >
                          {describeAnswer(assignment.completion.answer, contentById.get(assignment.activity.id))}
                        </Quote>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        <section className="lg:col-span-7">
          <SectionTitle icon={NotebookPen} iconClassName="text-lilac-500">
            Your observations
          </SectionTitle>
          {ownObservations.isLoading ? <LoadingState /> : null}
          {entries.length === 0 && !ownObservations.isLoading ? (
            <EmptyState
              className="mt-4"
              icon={NotebookPen}
              title="You have not recorded anything yet"
              description="Record what you notice and it goes to the review queue."
            />
          ) : (
            <Card isPlayful className="mt-4 p-6 sm:p-7">
              <RuledList>
                {entries.map((observation) => (
                  <RuledListItem
                    key={observation.id}
                    tone={
                      observation.level === 'significant'
                        ? 'significant'
                        : observation.status === 'pending'
                          ? 'pending'
                          : 'default'
                    }
                  >
                    <ObservationEntry
                      observation={observation}
                      authorName="You"
                      showClinicalDetail
                      teacherOnlyNote={observation.teacherOnlyNote}
                    />
                  </RuledListItem>
                ))}
              </RuledList>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
