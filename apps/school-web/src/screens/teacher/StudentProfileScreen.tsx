import { Link, useParams } from 'react-router-dom';
import {
  useActivities,
  useActivityQueue,
  useGrowthAreas,
  useObservations,
  useStudent,
} from '@evolveiq/api-client';
import {
  ASSIGNMENT_STATUS_LABELS,
  BackLink,
  GrowthAreaList,
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
  LoadingState,
  NotebookPen,
  Plus,
  RuledList,
  RuledListItem,
  Sprout,
} from '@evolveiq/ui';

/**
 * A teacher's full view of one student: up to five growth areas, activity
 * progress, and the complete observation history including clinical detail.
 */
export function StudentProfileScreen() {
  const { studentId } = useParams<{ studentId: string }>();
  const student = useStudent(studentId);
  const growthAreas = useGrowthAreas(studentId);
  const observations = useObservations(studentId ? { studentId } : {});
  const assignments = useActivityQueue(studentId ? { studentId } : {});
  const activities = useActivities();

  if (student.isLoading) return <LoadingState label="Loading the student" />;
  if (student.isError || !student.data) {
    return (
      <ErrorState
        title="We could not open that student"
        description="Go back to your students and try again."
      />
    );
  }

  const activityById = new Map((activities.data ?? []).map((activity) => [activity.id, activity]));
  const entries = observations.data ?? [];
  const openGrowthAreas = growthAreas.data ?? [];
  const assignPath = `/teacher/assign?studentId=${student.data.id}`;

  return (
    <div className="flex flex-col gap-8">
      <BackLink to="/teacher/students" className="self-start">
        My students
      </BackLink>

      <Card className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Avatar name={student.data.name} size="xl" className="size-20 text-2xl" />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {student.data.name}
            </h1>
            <p className="mt-1.5 text-base text-ink-muted">
              {ageFromDateOfBirth(student.data.dateOfBirth)} years old
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={assignPath} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
            <ClipboardList />
            Assign an activity
          </Link>
          <Link
            to={`/teacher/observations/new?studentId=${student.data.id}`}
            className={buttonClasses({ size: 'sm' })}
          >
            <Plus />
            New observation
          </Link>
        </div>
      </Card>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <div className="flex flex-col gap-10 lg:col-span-5">
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-ink">Growth areas</h2>
              <p className="text-sm tabular-nums text-ink-muted">{openGrowthAreas.length} of 5 open</p>
            </div>
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
            <h2 className="text-xl font-semibold tracking-tight text-ink">Activity progress</h2>
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
                        <p className="font-medium text-ink">
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
          <h2 className="text-xl font-semibold tracking-tight text-ink">Observation history</h2>
          {observations.isLoading ? <LoadingState /> : null}
          {entries.length === 0 && !observations.isLoading ? (
            <EmptyState
              className="mt-4"
              icon={NotebookPen}
              title="Nothing recorded yet"
              description="Record what you notice and it goes to the review queue."
            />
          ) : (
            <Card className="mt-4 p-6 sm:p-7">
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
