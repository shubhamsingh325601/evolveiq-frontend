import { useState } from 'react';
import {
  addMonths,
  businessMonth,
  useCreateHonour,
  useDeleteStaffReview,
  useHonours,
  useSaveStaffReview,
  useStaffReviews,
  useUsers,
  type NewHonour,
  type StaffReviewInput,
  type User,
} from '@evolveiq/api-client';
import { formatMonth, RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Avatar,
  Award,
  Badge,
  Button,
  Card,
  ErrorState,
  FormField,
  Lock,
  PageHeader,
  Presentation,
  RatingStars,
  Select,
  Star,
  StatTile,
  Trophy,
} from '@evolveiq/ui';
import { saveErrorMessage } from '../../components/account-fields';
import { HonourEditor, type HonourDraft } from '../../components/HonourEditor';
import { ReviewDialog } from '../../components/ReviewDialog';

/** The months a review can be written for: this one and the five before. */
const MONTHS_BACK = 6;

/**
 * Rating and evaluating staff (client feedback, 29 Oct 2026): once a month the
 * school admin rates each teacher 1–5 on five things, with a word of feedback.
 * The best-rated teacher is suggested for Staff of the Month, which is how a
 * review turns into recognition on the wall. Ratings themselves stay private
 * to the admin and the teacher.
 */
export function StaffReviewsScreen() {
  const [month, setMonth] = useState(businessMonth());
  const teachers = useUsers({ role: 'teacher', isActive: true });
  const reviews = useStaffReviews({ month });
  const honours = useHonours({ month, kind: 'staff_of_month' });
  const saveReview = useSaveStaffReview();
  const deleteReview = useDeleteStaffReview();
  const createHonour = useCreateHonour();

  const [rating, setRating] = useState<User | null>(null);
  const [error, setError] = useState<string>();
  const [honourDraft, setHonourDraft] = useState<HonourDraft | null>(null);
  const [honourError, setHonourError] = useState<string>();

  if (teachers.isError || reviews.isError) {
    return <ErrorState onRetry={() => void Promise.all([teachers.refetch(), reviews.refetch()])} />;
  }

  const staff = teachers.data ?? [];
  const reviewByStaff = new Map((reviews.data ?? []).map((review) => [review.staff.id, review]));
  const reviewed = staff.filter((teacher) => reviewByStaff.has(teacher.id));
  const schoolAverage =
    reviewed.length === 0 ? null : Math.round((reviewed.reduce((sum, t) => sum + (reviewByStaff.get(t.id)?.average ?? 0), 0) / reviewed.length) * 10) / 10;
  const named = (honours.data ?? [])[0];
  const best = [...reviewed].sort((a, b) => (reviewByStaff.get(b.id)?.average ?? 0) - (reviewByStaff.get(a.id)?.average ?? 0))[0];
  const bestReview = best ? reviewByStaff.get(best.id) : undefined;
  const months = Array.from({ length: MONTHS_BACK }, (_, index) => addMonths(businessMonth(), -index));
  const canName = months.slice(0, 2).includes(month);

  const save = async (review: StaffReviewInput) => {
    if (!rating) return;
    setError(undefined);
    try {
      await saveReview.mutateAsync({ staffId: rating.id, month, review });
      setRating(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that review. Try again.'));
    }
  };

  const nameHonour = async (honour: NewHonour) => {
    setHonourError(undefined);
    try {
      await createHonour.mutateAsync(honour);
      setHonourDraft(null);
    } catch (caught) {
      setHonourError(saveErrorMessage(caught, 'We could not put that on the wall. Try again.'));
    }
  };

  const columns: RecordsTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Teacher',
      sortValue: (teacher) => teacher.fullName,
      cell: (teacher) => (
        <span className="flex items-center gap-3">
          <Avatar name={teacher.fullName} size="sm" />
          <span className="font-bold text-ink">{teacher.fullName}</span>
        </span>
      ),
    },
    {
      id: 'rating',
      header: 'Rating',
      sortValue: (teacher) => reviewByStaff.get(teacher.id)?.average ?? 0,
      cell: (teacher) => {
        const review = reviewByStaff.get(teacher.id);
        return review ? (
          <span className="inline-flex items-center gap-2">
            <RatingStars value={review.average} label={`${teacher.fullName}’s rating`} size="sm" />
            <span className="font-bold tabular-nums text-ink">{review.average.toFixed(1)}</span>
          </span>
        ) : (
          <Badge tone="pending">Not reviewed</Badge>
        );
      },
    },
    {
      id: 'comment',
      header: 'Your word for them',
      isSecondary: true,
      cell: (teacher) => <span className="line-clamp-2 text-ink-muted">{reviewByStaff.get(teacher.id)?.comment ?? '—'}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Staff reviews" subtitle="Rate each teacher once a month, on five things. Only you and the teacher see a review." />
      <p className="-mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink-faint">
        <Lock className="size-3.5" /> Private to you and each teacher. The wall shows an honour, never a rating.
      </p>

      <FormField label="Month" className="max-w-xs">
        <Select value={month} onChange={(event) => setMonth(event.target.value)}>
          {months.map((value) => (
            <option key={value} value={value}>
              {formatMonth(value)}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Presentation} label="Teachers" value={staff.length} detail="At your school" />
        <StatTile icon={Award} tone="jade" label="Reviewed" value={`${reviewed.length} of ${staff.length}`} detail={formatMonth(month)} />
        <StatTile icon={Star} tone="star" label="Average" value={schoolAverage === null ? '–' : schoolAverage.toFixed(1)} detail="Of 5, across the month’s reviews" />
        <StatTile icon={Trophy} tone="honey" label="Staff of the Month" value={named ? named.honoree.fullName.split(' ')[0] : '–'} detail={named ? named.honoree.fullName : 'Not named yet'} />
      </div>

      {bestReview && best && !named && canName ? (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-star-200 bg-gradient-to-r from-star-50 to-white p-5">
          <div className="flex items-center gap-3">
            <Trophy className="size-8 fill-star-300 text-star-600" />
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-star-800">Best rated in {formatMonth(month)}</p>
              <p className="text-lg font-black text-ink">
                {best.fullName} · {bestReview.average.toFixed(1)} of 5
              </p>
            </div>
          </div>
          <Button icon={Trophy} onClick={() => setHonourDraft({ kind: 'staff_of_month', month, honoreeId: best.id })}>
            Name as Staff of the Month
          </Button>
        </Card>
      ) : null}

      <RecordsTable
        caption={`Teacher reviews, ${formatMonth(month)}`}
        rows={staff}
        columns={columns}
        getRowId={(teacher) => teacher.id}
        searchableText={(teacher) => teacher.fullName}
        searchPlaceholder="Search teachers"
        isLoading={teachers.isLoading || reviews.isLoading}
        onRowClick={(teacher) => setRating(teacher)}
        rowActions={(teacher) => (
          <span className="inline-flex gap-1">
            <Button variant="quiet" size="sm" onClick={() => setRating(teacher)}>
              {reviewByStaff.has(teacher.id) ? 'Change' : 'Rate'}
            </Button>
            {reviewByStaff.has(teacher.id) ? (
              <Button
                variant="danger-quiet"
                size="sm"
                isLoading={deleteReview.isPending && deleteReview.variables?.staffId === teacher.id}
                onClick={() => deleteReview.mutate({ staffId: teacher.id, month })}
              >
                Take back
              </Button>
            ) : null}
          </span>
        )}
        emptyTitle="No teachers yet"
        emptyDescription="Add teachers on the Teachers screen, then rate them here each month."
      />

      <ReviewDialog
        staff={rating}
        month={month}
        review={rating ? reviewByStaff.get(rating.id) : undefined}
        onClose={() => {
          setRating(null);
          setError(undefined);
        }}
        onSave={save}
        isSaving={saveReview.isPending}
        error={error}
      />
      <HonourEditor
        draft={honourDraft}
        teachers={staff.map((teacher) => ({ id: teacher.id, fullName: teacher.fullName }))}
        students={[]}
        onClose={() => {
          setHonourDraft(null);
          setHonourError(undefined);
        }}
        onSave={nameHonour}
        isSaving={createHonour.isPending}
        error={honourError}
      />
    </div>
  );
}
