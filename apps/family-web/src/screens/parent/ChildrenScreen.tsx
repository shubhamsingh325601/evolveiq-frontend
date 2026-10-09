import { Navigate } from 'react-router-dom';
import { useStudents } from '@evolveiq/api-client';
import { EmptyState, ErrorState, LoadingState, UsersRound } from '@evolveiq/ui';

/**
 * The parent's landing route. Every child has their own dashboard, so this
 * opens the first one; the switcher at the top of it reaches the others.
 */
export function ChildrenScreen() {
  const students = useStudents();

  if (students.isLoading) return <LoadingState label="Loading your children" />;
  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const firstChild = students.data?.[0];
  if (firstChild) return <Navigate to={`/parent/children/${firstChild.id}`} replace />;

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Parent Dashboard</h1>
      <EmptyState
        icon={UsersRound}
        title="No children linked to your account yet"
        description="Your school adds this link. Ask the school office if you were expecting to see someone here."
      />
    </div>
  );
}
