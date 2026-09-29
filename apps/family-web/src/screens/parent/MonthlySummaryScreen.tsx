import { useParams } from 'react-router-dom';
import { useGrowthAreas, useMonthlySummary, useStudent } from '@evolveiq/api-client';
import { BackLink, GrowthAreaList, formatMonth } from '@evolveiq/domain';
import {
  CalendarDays,
  Card,
  Check,
  EmptyState,
  ErrorState,
  LoadingState,
  NotebookPen,
  PageHeader,
  Quote,
} from '@evolveiq/ui';

/**
 * The parent's plain-language monthly read. No scores, no clinical language —
 * a summary written for someone who is not a specialist, so it is set in the
 * serif like everything else a person wrote.
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
        back={
          <BackLink to={`/parent/children/${childId}`}>
            {student.data?.name ?? 'Back to profile'}
          </BackLink>
        }
        title="This month"
        subtitle={summary.data ? formatMonth(summary.data.month) : undefined}
      />

      {!summary.data ? (
        <EmptyState
          icon={CalendarDays}
          title="No summary for this month yet"
          description="A summary is written once there is enough in the month to say something useful."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-12">
            <Card isPlayful className="p-6 sm:p-10 lg:col-span-8">
              <h2 className="max-w-2xl font-serif text-3xl leading-tight text-ink sm:text-4xl sm:leading-tight">
                {summary.data.headline}
              </h2>
              <Quote className="mt-6">{summary.data.body}</Quote>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:content-start">
              <Card className="flex items-center gap-4 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-jade-50 text-jade-600">
                  <Check className="size-6" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-ink">
                    {summary.data.activitiesCompleted}
                  </p>
                  <p className="text-sm text-ink-muted">activities finished this month</p>
                </div>
              </Card>
              <Card className="flex items-center gap-4 p-5">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lilac-50 text-lilac-600">
                  <NotebookPen className="size-6" />
                </span>
                <div>
                  <p className="text-3xl font-semibold tabular-nums text-ink">
                    {summary.data.observationsLogged}
                  </p>
                  <p className="text-sm text-ink-muted">observations recorded this month</p>
                </div>
              </Card>
            </div>
          </div>

          {(growthAreas.data ?? []).length > 0 ? (
            <section>
              <h2 className="text-xl font-semibold tracking-tight text-ink">Growth areas</h2>
              <GrowthAreaList
                className="mt-4 md:grid-cols-2"
                growthAreas={growthAreas.data ?? []}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
