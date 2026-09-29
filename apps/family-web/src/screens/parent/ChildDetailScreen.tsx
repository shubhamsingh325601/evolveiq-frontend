import { Link, useParams } from 'react-router-dom';
import { useGrowthAreas, useObservations, useStudent } from '@evolveiq/api-client';
import {
  BackLink,
  GrowthAreaList,
  ObservationEntry,
  ageFromDateOfBirth,
} from '@evolveiq/domain';
import {
  Avatar,
  buttonClasses,
  CalendarDays,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  MessageCircle,
  NotebookPen,
  Plus,
  RuledList,
  RuledListItem,
  Sprout,
} from '@evolveiq/ui';

/**
 * A parent's view of one child.
 *
 * Nothing clinical appears here: the observations arrive already stripped of
 * level, learning-behaviour area and psychologist notes by `packages/api-client`.
 */
export function ChildDetailScreen() {
  const { childId } = useParams<{ childId: string }>();
  const student = useStudent(childId);
  const growthAreas = useGrowthAreas(childId);
  const observations = useObservations(childId ? { studentId: childId } : {});

  if (student.isLoading) return <LoadingState label="Loading" />;
  if (student.isError || !student.data) {
    return (
      <ErrorState
        title="We could not open that child"
        description="Go back to your children and try again."
      />
    );
  }

  const child = student.data;
  const openAreas = growthAreas.data ?? [];
  const entries = observations.data ?? [];
  const newObservationPath = `/parent/observations/new?childId=${child.id}`;

  return (
    <div className="flex flex-col gap-8">
      <BackLink to="/parent/children" className="self-start">
        My children
      </BackLink>

      <Card isPlayful className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <Avatar name={child.name} size="xl" className="size-20 text-2xl" />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {child.name}
            </h1>
            <p className="mt-1.5 text-base text-ink-muted">
              {ageFromDateOfBirth(child.dateOfBirth)} years old
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/parent/children/${child.id}/notes`}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            <MessageCircle />
            Teacher notes
          </Link>
          <Link
            to={`/parent/children/${child.id}/summary`}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            <CalendarDays />
            This month
          </Link>
          <Link to={newObservationPath} className={buttonClasses({ size: 'sm' })}>
            <Plus />
            Add an observation
          </Link>
        </div>
      </Card>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <section className="lg:col-span-5">
          <h2 className="text-xl font-semibold tracking-tight text-ink">What we are working on</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Growth areas are chosen by the school after reviewing what teachers and
            you have noticed.
          </p>
          {openAreas.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={Sprout}
              title="No growth areas open"
              description="The school opens one when a pattern shows up across several observations."
            />
          ) : (
            <GrowthAreaList className="mt-4" growthAreas={openAreas} />
          )}
        </section>

        <section className="lg:col-span-7">
          <h2 className="text-xl font-semibold tracking-tight text-ink">What has been noticed</h2>
          <p className="mt-1 max-w-prose text-sm text-ink-muted">
            Everything you and the school have written down, newest first.
          </p>
          {observations.isLoading ? <LoadingState /> : null}
          {entries.length === 0 && !observations.isLoading ? (
            <EmptyState
              className="mt-4"
              icon={NotebookPen}
              title="Nothing recorded yet"
              description="Add the first observation and the school will see it."
              action={
                <Link to={newObservationPath} className={buttonClasses({ size: 'sm' })}>
                  <Plus />
                  Add an observation
                </Link>
              }
            />
          ) : (
            <Card className="mt-4 p-6 sm:p-7">
              <RuledList>
                {entries.map((observation) => (
                  <RuledListItem
                    key={observation.id}
                    tone={observation.status === 'pending' ? 'pending' : 'default'}
                  >
                    <ObservationEntry observation={observation} />
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
