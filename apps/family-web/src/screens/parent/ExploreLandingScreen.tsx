import { Navigate, useParams } from 'react-router-dom';
import { useChildren } from '@evolveiq/api-client';
import { Compass, EmptyState, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';
import { useLastChildId } from '../../useLastChildId';

/**
 * The Explore tab's own address. It opens the child the parent had open last
 * (else the first), so the tab never needs a child in its path; links from
 * before Explore was a tab (`/parent/children/:childId/explore`) land here too.
 */
export function ExploreLandingScreen() {
  const { childId: childInPath } = useParams<{ childId: string }>();
  const lastChildId = useLastChildId();
  const children = useChildren();

  if (childInPath) return <Navigate to={`/parent/explore/${childInPath}`} replace />;
  if (children.isLoading) return <LoadingState label="Finding ideas" />;
  if (children.isError) return <ErrorState onRetry={() => void children.refetch()} />;

  const list = children.data ?? [];
  const child = list.find((candidate) => candidate.id === lastChildId) ?? list[0];
  if (child) return <Navigate to={`/parent/explore/${child.id}`} replace />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Explore" subtitle="Ideas to try together, starting from your child's strengths." />
      <EmptyState
        icon={Compass}
        title="No children linked to your account yet"
        description="Your school adds this link. Ask the school office if you were expecting to see someone here."
      />
    </div>
  );
}
