import { useAuth } from '@evolveiq/auth';
import { useHonours, useStaffReviews } from '@evolveiq/api-client';
import { formatMonth, HonourCard, STAFF_RATING_CRITERIA, STAFF_RATING_LABELS } from '@evolveiq/domain';
import { Award, Card, EmptyState, ErrorState, Lock, LoadingState, PageHeader, Quote, RatingStars } from '@evolveiq/ui';

/**
 * A teacher's own monthly reviews from their school admin (client feedback,
 * 29 Oct 2026: "rate and evaluate staff"): the five ratings, the average and
 * the comment. Private — no one else sees a teacher's ratings; the wall shows
 * only an honour.
 */
export function ReviewsScreen() {
  const { user } = useAuth();
  const reviews = useStaffReviews();
  const honours = useHonours({ kind: 'staff_of_month' });
  if (reviews.isLoading) return <LoadingState label="Loading your reviews" />;
  if (reviews.isError) return <ErrorState onRetry={() => void reviews.refetch()} />;

  const mine = reviews.data ?? [];
  const myHonours = (honours.data ?? []).filter((honour) => honour.honoree.id === user?.id);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Your reviews" subtitle="What your school admin noted about each month. Only you and the school admin see these." />
      <p className="-mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
        <Lock className="size-3.5" /> Private to you and your school admin.
      </p>

      {myHonours.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {myHonours.map((honour) => (
            <HonourCard key={honour.id} honour={honour} />
          ))}
        </div>
      ) : null}

      {mine.length === 0 ? (
        <EmptyState icon={Award} title="No reviews yet" description="Your school admin reviews each month; it shows up here when they do." />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {mine.map((review) => (
            <Card as="li" key={review.id} className="flex flex-col gap-4 p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-black tracking-tight text-ink">{formatMonth(review.month)}</h2>
                <p className="text-2xl font-black tabular-nums text-ink">
                  {review.average.toFixed(1)}
                  <span className="text-sm font-semibold text-ink-muted"> of 5</span>
                </p>
              </div>
              <dl className="flex flex-col gap-2">
                {STAFF_RATING_CRITERIA.map((criterion) => (
                  <div key={criterion} className="flex items-center justify-between gap-3">
                    <dt className="text-sm font-semibold text-ink-muted">{STAFF_RATING_LABELS[criterion]}</dt>
                    <dd>
                      <RatingStars value={review.ratings[criterion]} label={STAFF_RATING_LABELS[criterion]} size="sm" />
                    </dd>
                  </div>
                ))}
              </dl>
              {review.comment ? <Quote size="sm" attribution={review.reviewedBy.fullName}>{review.comment}</Quote> : null}
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
