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
  GrowthAreaList,
  ObservationEntry,
  ageFromDateOfBirth,
  formatRelativeDay,
} from '@evolveiq/domain';
import {
  Badge,
  buttonClasses,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  RuledList,
  RuledListItem,
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

  return (
    <div className="flex flex-col gap-9">
      <header className="border-b border-line pb-6">
        <h1 className="font-serif text-4xl text-ink">{student.data.name}</h1>
        <p className="mt-2 text-base text-ink-muted">
          {ageFromDateOfBirth(student.data.dateOfBirth)} years old
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to={`/teacher/observations/new?studentId=${student.data.id}`}
            className={buttonClasses({ size: 'sm' })}
          >
            New observation
          </Link>
          <Link
            to={`/teacher/assign?studentId=${student.data.id}`}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            Assign an activity
          </Link>
        </div>
      </header>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold text-ink">Growth areas</h2>
          <p className="text-sm text-ink-muted tabular-nums">
            {openGrowthAreas.length} of 5 open
          </p>
        </div>
        {openGrowthAreas.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No growth areas open"
            description="A psychologist opens one after reviewing a pattern across observations."
          />
        ) : (
          <GrowthAreaList className="mt-4" growthAreas={openGrowthAreas} />
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Activity progress</h2>
        {(assignments.data ?? []).length === 0 ? (
          <EmptyState
            className="mt-4"
            title="Nothing assigned yet"
            description="Assign an activity and its progress will show here."
            action={
              <Link
                to={`/teacher/assign?studentId=${student.data.id}`}
                className={buttonClasses({ size: 'sm' })}
              >
                Assign an activity
              </Link>
            }
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {(assignments.data ?? []).map((assignment) => (
              <Card
                as="li"
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">
                    {activityById.get(assignment.activityId)?.title ?? 'Activity'}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    Set by {assignment.assignedByName}, due {formatRelativeDay(assignment.dueOn)}
                  </p>
                </div>
                <Badge tone={assignment.status === 'completed' ? 'growth' : 'neutral'}>
                  {ASSIGNMENT_STATUS_LABELS[assignment.status]}
                </Badge>
              </Card>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Observation history</h2>
        {observations.isLoading ? <LoadingState /> : null}
        {entries.length === 0 && !observations.isLoading ? (
          <EmptyState
            className="mt-4"
            title="Nothing recorded yet"
            description="Record what you notice and it goes to the review queue."
          />
        ) : (
          <RuledList className="mt-5">
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
        )}
      </section>
    </div>
  );
}
