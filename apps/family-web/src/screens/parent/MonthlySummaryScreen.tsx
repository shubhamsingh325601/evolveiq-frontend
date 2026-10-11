import { useParams, useSearchParams } from 'react-router-dom';
import {
  addMonths,
  businessMonth,
  isApiError,
  useChildren,
  useGrowthAreas,
  useMonthlySummary,
} from '@evolveiq/api-client';
import { BackLink, firstNameOf, formatMonth, GrowthAreaList, possessive } from '@evolveiq/domain';
import {
  Button,
  CalendarDays,
  Card,
  ChevronLeft,
  ChevronRight,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Quote,
} from '@evolveiq/ui';

/**
 * The parent's plain-language monthly read. No scores, no clinical language —
 * template sentences built from what was finished and what is being worked
 * on. This month is written live; a finished month is kept exactly as it was
 * first written. Set in the serif, like everything written about a child.
 */
export function MonthlySummaryScreen() {
  const { childId } = useParams<{ childId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentMonth = businessMonth();
  const requested = searchParams.get('month');
  const month = requested && /^\d{4}-\d{2}$/.test(requested) && requested <= currentMonth ? requested : currentMonth;

  const children = useChildren();
  const summary = useMonthlySummary(childId, month);
  const growthAreas = useGrowthAreas(childId);

  const child = (children.data ?? []).find((candidate) => candidate.id === childId);
  const firstName = child ? firstNameOf(child.fullName) : 'your child';
  const isBeforeAccount = isApiError(summary.error) && summary.error.status === 404;
  const goTo = (next: string) =>
    setSearchParams(next === currentMonth ? {} : { month: next }, { replace: true });

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        back={<BackLink to={`/parent/children/${childId}`}>{child ? `${possessive(firstName)} dashboard` : 'Back'}</BackLink>}
        title={month === currentMonth ? 'This month' : formatMonth(month)}
        subtitle={month === currentMonth ? `${formatMonth(month)}, so far` : 'As it was written when the month ended'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              icon={ChevronLeft}
              disabled={isBeforeAccount}
              onClick={() => goTo(addMonths(month, -1))}
            >
              Earlier
            </Button>
            <Button size="sm" variant="secondary" disabled={month === currentMonth} onClick={() => goTo(addMonths(month, 1))}>
              Later
              <ChevronRight />
            </Button>
          </div>
        }
      />

      {summary.isLoading ? <LoadingState label="Loading the summary" /> : null}

      {isBeforeAccount ? (
        <EmptyState
          icon={CalendarDays}
          title={`No summary for ${formatMonth(month)}`}
          description={`${firstName} was not on EvolvIQ yet that month.`}
          action={
            <Button size="sm" onClick={() => goTo(currentMonth)}>
              Back to this month
            </Button>
          }
        />
      ) : null}

      {summary.isError && !isBeforeAccount ? <ErrorState onRetry={() => void summary.refetch()} /> : null}

      {summary.data ? (
        <Card isPlayful className="p-6 sm:p-10">
          <Quote size="lg">{summary.data.text}</Quote>
        </Card>
      ) : null}

      {month === currentMonth && (growthAreas.data ?? []).length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold tracking-tight text-ink">Growth areas</h2>
          <GrowthAreaList className="mt-4 md:grid-cols-2" growthAreas={growthAreas.data ?? []} />
        </section>
      ) : null}
    </div>
  );
}
