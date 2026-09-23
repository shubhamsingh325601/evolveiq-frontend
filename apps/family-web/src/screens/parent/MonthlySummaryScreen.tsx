import { Link, useParams } from 'react-router-dom';
import { useGrowthAreas, useMonthlySummary, useStudent } from '@evolveiq/api-client';
import { GrowthAreaList, formatMonth } from '@evolveiq/domain';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

/**
 * The parent's plain-language monthly read. No scores, no clinical language —
 * a summary written for someone who is not a specialist.
 */
export function MonthlySummaryScreen() {
  const { childId } = useParams<{ childId: string }>();
  const student = useStudent(childId);
  const summary = useMonthlySummary(childId);
  const growthAreas = useGrowthAreas(childId);

  if (summary.isLoading || student.isLoading) return <LoadingState label="Loading the summary" />;
  if (summary.isError) return <ErrorState onRetry={() => void summary.refetch()} />;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="This month"
        subtitle={summary.data ? formatMonth(summary.data.month) : undefined}
        actions={
          <Link
            to={`/parent/children/${childId}`}
            className="text-sm font-medium text-teal-600 underline underline-offset-4"
          >
            Back to profile
          </Link>
        }
      />

      {!summary.data ? (
        <EmptyState
          title="No summary for this month yet"
          description="A summary is written once there is enough in the month to say something useful."
        />
      ) : (
        <>
          <section>
            <h2 className="max-w-prose font-serif text-3xl leading-tight text-ink">
              {summary.data.headline}
            </h2>
            <p className="mt-5 max-w-prose text-base leading-7 text-ink-muted">
              {summary.data.body}
            </p>
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="px-5 py-4">
              <p className="text-3xl font-semibold tabular-nums text-ink">
                {summary.data.activitiesCompleted}
              </p>
              <p className="mt-1 text-sm text-ink-muted">activities finished this month</p>
            </Card>
            <Card className="px-5 py-4">
              <p className="text-3xl font-semibold tabular-nums text-ink">
                {summary.data.observationsLogged}
              </p>
              <p className="mt-1 text-sm text-ink-muted">observations recorded this month</p>
            </Card>
          </div>

          {(growthAreas.data ?? []).length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold text-ink">Growth areas</h2>
              <GrowthAreaList className="mt-4" growthAreas={growthAreas.data ?? []} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
