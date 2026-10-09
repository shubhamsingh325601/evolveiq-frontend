import { Link, useParams } from 'react-router-dom';
import {
  useActivities,
  useActivityQueue,
  useClasses,
  useGrowthAreas,
  useHolisticIndex,
  useObservations,
  useStudent,
} from '@evolveiq/api-client';
import {
  ASSIGNMENT_STATUS_LABELS,
  BackLink,
  GrowthAreaList,
  HolisticIndexCard,
  ObservationEntry,
  ageFromDateOfBirth,
  formatRelativeDay,
} from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  buttonClasses,
  Card,
  ClipboardList,
  EmptyState,
  ErrorState,
  FileText,
  LayoutGrid,
  LoadingState,
  NotebookPen,
  Plus,
  RuledList,
  RuledListItem,
  SectionTitle,
  Sprout,
} from '@evolveiq/ui';

/**
 * A teacher's full view of one student: their EvolvIQ Holistic Index, up to
 * five growth areas, activity progress, and the complete observation history
 * including clinical detail.
 */
export function StudentProfileScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const student = useStudent(studentId);
  const holisticIndex = useHolisticIndex(studentId);
  const growthAreas = useGrowthAreas(studentId);
  const observations = useObservations(studentId ? { studentId } : {});
  const assignments = useActivityQueue(studentId ? { studentId } : {});
  const activities = useActivities();
  const classes = useClasses();

  if (student.isLoading) return <LoadingState label="Loading the student" />;
  if (student.isError || !student.data) {
    return (
      <ErrorState
        title="We could not open that student"
        description="Go back to your students and try again."
      />
    );
  }

  const child = student.data;
  const activityById = new Map((activities.data ?? []).map((activity) => [activity.id, activity]));
  const className = (classes.data ?? []).find((group) => group.id === child.classId)?.name;
  const entries = observations.data ?? [];
  const openGrowthAreas = growthAreas.data ?? [];
  const assignPath = `/teacher/assign?studentId=${child.id}`;

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
            <Avatar name={child.name} size="xl" className="size-20 text-2xl" />
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">
                {child.name}
              </h1>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {className ? (
                  <li>
                    <Badge icon={LayoutGrid}>Class {className}</Badge>
                  </li>
                ) : null}
                <li>
                  <Badge>{ageFromDateOfBirth(child.dateOfBirth)} years old</Badge>
                </li>
                <li>
                  <Badge tone="growth" icon={Sprout}>
                    {child.growthAreaIds.length} of 5 growth areas
                  </Badge>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {holisticIndex.data ? (
              <Link
                to={`/teacher/students/${child.id}/report`}
                className={buttonClasses({ variant: 'secondary', size: 'sm' })}
              >
                <FileText />
                Holistic Report
              </Link>
            ) : null}
            <Link to={assignPath} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <ClipboardList />
              Assign an activity
            </Link>
            <Link
              to={`/teacher/observations/new?studentId=${child.id}`}
              className={buttonClasses({ size: 'sm' })}
            >
              <Plus />
              New observation
            </Link>
          </div>
        </div>
      </Card>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-10 lg:col-span-5">
          {holisticIndex.data ? (
            <HolisticIndexCard studentName={child.name} index={holisticIndex.data} />
          ) : null}

          <section>
            <SectionTitle
              icon={Sprout}
              iconClassName="text-jade-500"
              action={
                <p className="text-sm font-semibold tabular-nums text-ink-muted">
                  {openGrowthAreas.length} of 5 open
                </p>
              }
            >
              Growth areas
            </SectionTitle>
            {openGrowthAreas.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={Sprout}
                title="No growth areas open"
                description="A psychologist opens one after reviewing a pattern across observations."
              />
            ) : (
              <GrowthAreaList className="mt-4" growthAreas={openGrowthAreas} />
            )}
          </section>

          <section>
            <SectionTitle icon={ClipboardList}>Activity progress</SectionTitle>
            {(assignments.data ?? []).length === 0 ? (
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
                  {(assignments.data ?? []).map((assignment) => (
                    <li
                      key={assignment.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-ink">
                          {activityById.get(assignment.activityId)?.title ?? 'Activity'}
                        </p>
                        <p className="mt-0.5 text-sm text-ink-muted">
                          Set by {assignment.assignedByName}, due{' '}
                          {formatRelativeDay(assignment.dueOn)}
                        </p>
                      </div>
                      <Badge tone={assignment.status === 'completed' ? 'growth' : 'neutral'}>
                        {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        </div>

        <section className="lg:col-span-7">
          <SectionTitle icon={NotebookPen} iconClassName="text-lilac-500">
            Observation history
          </SectionTitle>
          {observations.isLoading ? <LoadingState /> : null}
          {entries.length === 0 && !observations.isLoading ? (
            <EmptyState
              className="mt-4"
              icon={NotebookPen}
              title="Nothing recorded yet"
              description="Record what you notice and it goes to the review queue."
            />
          ) : (
            <Card isPlayful className="mt-4 p-6 sm:p-7">
              <RuledList>
                {entries.map((observation) => (
                  <RuledListItem
                    key={observation.id}
                    tone={
                      observation.isSignificant
                        ? 'significant'
                        : observation.status === 'pending'
                          ? 'pending'
                          : 'default'
                    }
                  >
                    <ObservationEntry observation={observation} showClinicalDetail />
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
