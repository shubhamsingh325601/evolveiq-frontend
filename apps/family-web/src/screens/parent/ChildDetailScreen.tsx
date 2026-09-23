import { Link, useParams } from 'react-router-dom';
import { useGrowthAreas, useObservations, useStudent } from '@evolveiq/api-client';
import { GrowthAreaList, ObservationEntry, ageFromDateOfBirth } from '@evolveiq/domain';
import {
  buttonClasses,
  EmptyState,
  ErrorState,
  LoadingState,
  RuledList,
  RuledListItem,
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

  return (
    <div className="flex flex-col gap-9">
      <header className="border-b border-line pb-6">
        <h1 className="font-serif text-4xl text-ink">{child.name}</h1>
        <p className="mt-2 text-base text-ink-muted">
          {ageFromDateOfBirth(child.dateOfBirth)} years old
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to={`/parent/children/${child.id}/notes`}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            Teacher notes
          </Link>
          <Link
            to={`/parent/children/${child.id}/summary`}
            className={buttonClasses({ variant: 'secondary', size: 'sm' })}
          >
            This month
          </Link>
          <Link to="/parent/observations/new" className={buttonClasses({ size: 'sm' })}>
            Add an observation
          </Link>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold text-ink">What we are working on</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">
          Growth areas are chosen by the school after reviewing what teachers and
          you have noticed.
        </p>
        {(growthAreas.data ?? []).length === 0 ? (
          <EmptyState
            className="mt-4"
            title="No growth areas open"
            description="The school opens one when a pattern shows up across several observations."
          />
        ) : (
          <GrowthAreaList className="mt-4" growthAreas={growthAreas.data ?? []} />
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">What has been noticed</h2>
        {observations.isLoading ? <LoadingState /> : null}
        {(observations.data ?? []).length === 0 && !observations.isLoading ? (
          <EmptyState
            className="mt-4"
            title="Nothing recorded yet"
            description="Add the first observation and the school will see it."
            action={
              <Link
                to="/parent/observations/new"
                className="text-sm font-medium text-teal-600 underline underline-offset-4"
              >
                Add an observation
              </Link>
            }
          />
        ) : (
          <RuledList className="mt-5">
            {(observations.data ?? []).map((observation) => (
              <RuledListItem
                key={observation.id}
                tone={observation.status === 'pending' ? 'pending' : 'default'}
              >
                <ObservationEntry observation={observation} />
              </RuledListItem>
            ))}
          </RuledList>
        )}
      </section>
    </div>
  );
}
