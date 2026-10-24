import { useParams } from 'react-router-dom';
import { useChildren, useHolisticIndex } from '@evolveiq/api-client';
import { firstNameOf, FutureExplorer, possessive } from '@evolveiq/domain';
import { ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/** Future Explorer for a parent: where their child's strengths could lead. */
export function ExploreScreen() {
  const { childId } = useParams<{ childId: string }>();
  const children = useChildren();
  const holistic = useHolisticIndex(childId);
  if (children.isLoading || holistic.isLoading) return <LoadingState label="Finding ideas" />;
  const child = (children.data ?? []).find((candidate) => candidate.id === childId);
  if (children.isError || holistic.isError || !child || !holistic.data) {
    return <ErrorState title="We could not open that page" description="Go back to your children and try again." />;
  }
  const name = firstNameOf(child.fullName);
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Explore with ${name}`} subtitle={`Ideas that start from what has been noticed about ${name}, not from a test.`} />
      <FutureExplorer strengths={holistic.data.strengths} name={name} audience="family" />
      <p className="text-xs font-medium text-ink-faint">
        {possessive(name)} ideas change as more is noticed. Scholarships and entrance exams are not listed here, because they change every year and need a
        source that is kept up to date.
      </p>
    </div>
  );
}
