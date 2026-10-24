import { Link } from 'react-router-dom';
import { useChildren, useHolisticIndexes, type HolisticDimension } from '@evolveiq/api-client';
import {
  firstNameOf,
  HOLISTIC_DIMENSION_COLOR_CLASSES,
  HOLISTIC_DIMENSION_LABELS,
  possessive,
} from '@evolveiq/domain';
import { Card, cn, EmptyState, ErrorState, LoadingState, PageHeader, Users } from '@evolveiq/ui';

const PILLARS: HolisticDimension[] = ['education', 'skills', 'physical', 'wellbeing', 'character'];

/**
 * Brothers and sisters side by side, each in their own right. Nothing here
 * ranks them: children are listed in the order the family knows them, there is
 * no "best" or "winner", and each child's strengths come first, because the
 * point is how each one shines, not who is ahead.
 */
export function SiblingsScreen() {
  const children = useChildren();
  const list = children.data ?? [];
  const indexes = useHolisticIndexes(list.map((child) => child.id));

  if (children.isLoading || indexes.isLoading) return <LoadingState label="Loading" />;
  if (children.isError || indexes.isError) return <ErrorState onRetry={() => void children.refetch()} />;
  if (list.length < 2) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader title="Siblings" subtitle="Each child, in their own right." />
        <EmptyState
          icon={Users}
          title="One child so far"
          description="When more than one of your children is on EvolvIQ, they appear here together."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Siblings"
        subtitle="Every child grows differently. This page shows how each one shines. It is not a league table."
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {list.map((child) => {
          const index = indexes.byStudent.get(child.id);
          const firstName = firstNameOf(child.fullName);
          return (
            <Card key={child.id} isPlayful className="flex flex-col gap-5 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black tracking-tight text-ink">{firstName}</h2>
                <Link
                  to={`/parent/children/${child.id}/report`}
                  className="rounded-full text-xs font-bold text-iris-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
                >
                  {possessive(firstName)} report
                </Link>
              </div>
              {index ? (
                <>
                  <section aria-label={`${possessive(firstName)} strengths`}>
                    <p className="text-[0.625rem] font-bold uppercase tracking-widest text-ink-faint">Shines at</p>
                    {index.strengths.length > 0 ? (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {index.strengths.map((strength) => (
                          <li key={strength} className="rounded-xl bg-jade-50 px-3 py-1.5 text-xs font-bold text-jade-700">
                            {strength}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-sm font-medium text-ink-muted">
                        Still getting to know {firstName}. Add a star when you notice something good.
                      </p>
                    )}
                  </section>
                  <ul className="flex flex-col gap-2.5" aria-label={`${possessive(firstName)} five pillars`}>
                    {PILLARS.map((pillar) => {
                      const score = index.dimensions.find((d) => d.dimension === pillar)?.score ?? 50;
                      return (
                        <li key={pillar}>
                          <div className="flex items-baseline justify-between text-xs font-bold text-ink-muted">
                            <span>{HOLISTIC_DIMENSION_LABELS[pillar]}</span>
                            <span>{score}</span>
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-line-soft">
                            <div
                              className={cn('h-full rounded-full bg-current', HOLISTIC_DIMENSION_COLOR_CLASSES[pillar])}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-ink-muted">Not ready yet.</p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
