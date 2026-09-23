import { Link } from 'react-router-dom';
import { useStudents } from '@evolveiq/api-client';
import { ageFromDateOfBirth } from '@evolveiq/domain';
import { Avatar, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

export function ChildrenScreen() {
  const students = useStudents();

  if (students.isLoading) return <LoadingState label="Loading your children" />;
  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const children = students.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My children"
        subtitle="Open a child to see what their school has noticed and what they are working on."
      />

      {children.length === 0 ? (
        <EmptyState
          title="No children linked to your account yet"
          description="Your school adds this link. Ask the school office if you were expecting to see someone here."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {children.map((child) => (
            <Card as="li" key={child.id}>
              <Link
                to={`/parent/children/${child.id}`}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-sunk focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-500"
              >
                <Avatar name={child.name} size="lg" />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-xl text-ink">{child.name}</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">
                    {ageFromDateOfBirth(child.dateOfBirth)} years old,{' '}
                    {child.growthAreaIds.length === 0
                      ? 'no growth areas open'
                      : `${child.growthAreaIds.length} growth ${
                          child.growthAreaIds.length === 1 ? 'area' : 'areas'
                        } being worked on`}
                  </span>
                </span>
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
