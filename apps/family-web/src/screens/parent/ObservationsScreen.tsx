import { Link } from 'react-router-dom';
import { useObservations, useStudents } from '@evolveiq/api-client';
import { ObservationEntry } from '@evolveiq/domain';
import {
  buttonClasses,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  NotebookPen,
  PageHeader,
  Plus,
  RuledList,
  RuledListItem,
} from '@evolveiq/ui';

/** Everything this parent has recorded, plus what their children's teachers have. */
export function ObservationsScreen() {
  const observations = useObservations();
  const students = useStudents();

  if (observations.isLoading) return <LoadingState label="Loading observations" />;
  if (observations.isError) return <ErrorState onRetry={() => void observations.refetch()} />;

  const nameById = new Map((students.data ?? []).map((student) => [student.id, student.name]));
  const entries = observations.data ?? [];

  const addLink = (
    <Link to="/parent/observations/new" className={buttonClasses({ size: 'sm' })}>
      <Plus />
      Add an observation
    </Link>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Observations"
        subtitle="Everything recorded about your children, by you and by their teachers."
        actions={addLink}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Nothing recorded yet"
          description="Write down something you have noticed, and the school will see it."
          action={addLink}
        />
      ) : (
        <Card className="max-w-3xl p-6 sm:p-8">
          <RuledList>
            {entries.map((observation) => (
              <RuledListItem
                key={observation.id}
                tone={observation.status === 'pending' ? 'pending' : 'default'}
              >
                <ObservationEntry
                  observation={observation}
                  studentName={nameById.get(observation.studentId) ?? undefined}
                />
              </RuledListItem>
            ))}
          </RuledList>
        </Card>
      )}
    </div>
  );
}
