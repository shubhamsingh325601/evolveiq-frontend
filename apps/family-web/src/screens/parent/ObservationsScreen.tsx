import { Link } from 'react-router-dom';
import { useChildren, useFamilyObservations } from '@evolveiq/api-client';
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
  Star,
} from '@evolveiq/ui';

/** Everything this parent has recorded about their children: the stars they gave, and the concerns and where each stands. */
export function ObservationsScreen() {
  const observations = useFamilyObservations();
  const children = useChildren();

  if (observations.isLoading) return <LoadingState label="Loading observations" />;
  if (observations.isError) return <ErrorState onRetry={() => void observations.refetch()} />;

  const nameById = new Map((children.data ?? []).map((child) => [child.id, child.fullName]));
  const entries = observations.data ?? [];

  const actions = (
    <>
      <Link to="/parent/observations/new?tone=positive" className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
        <Star />
        Celebrate something
      </Link>
      <Link to="/parent/observations/new" className={buttonClasses({ size: 'sm' })}>
        <Plus />
        Add an observation
      </Link>
    </>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Observations"
        subtitle="What you have recorded about your children: the stars you gave, and the concerns and whether the school has read them."
        actions={actions}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="Nothing recorded yet"
          description="Celebrate something your child did, or write down something to look into and the school counsellor will read it."
          action={actions}
        />
      ) : (
        <Card className="max-w-3xl p-6 sm:p-8">
          <RuledList>
            {entries.map((observation) => (
              <RuledListItem
                key={observation.id}
                tone={observation.tone === 'positive' ? 'star' : observation.status === 'pending' ? 'pending' : 'default'}
              >
                <ObservationEntry
                  observation={observation}
                  audience="family"
                  authorName="You"
                  {...(nameById.has(observation.studentId) ? { studentName: nameById.get(observation.studentId) } : {})}
                />
              </RuledListItem>
            ))}
          </RuledList>
        </Card>
      )}
    </div>
  );
}
