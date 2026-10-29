import { useEffect, useState } from 'react';
import type { StaffRatings, StaffReview, StaffReviewInput } from '@evolveiq/api-client';
import { formatMonth, STAFF_RATING_CRITERIA, STAFF_RATING_LABELS } from '@evolveiq/domain';
import { Button, CircleAlert, FormField, Modal, RatingStars, Textarea } from '@evolveiq/ui';

export interface ReviewDialogProps {
  /** The teacher being rated; null closes the dialog. */
  staff: { id: string; fullName: string } | null;
  month: string;
  /** Their review for the month, if there is one: the dialog starts from it. */
  review?: StaffReview | undefined;
  onClose: () => void;
  onSave: (review: StaffReviewInput) => Promise<unknown>;
  isSaving?: boolean;
  error?: string | undefined;
}

const UNRATED: StaffRatings = { teaching: 0, engagement: 0, punctuality: 0, teamwork: 0, communication: 0 };

/** A teacher's month in five ratings, 1 to 5, and a word of feedback for them. */
export function ReviewDialog({ staff, month, review, onClose, onSave, isSaving = false, error }: ReviewDialogProps) {
  const [ratings, setRatings] = useState<StaffRatings>(UNRATED);
  const [comment, setComment] = useState('');
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    if (!staff) return;
    setRatings(review ? { ...review.ratings } : UNRATED);
    setComment(review?.comment ?? '');
    setProblem(undefined);
  }, [staff, review]);

  const save = () => {
    if (STAFF_RATING_CRITERIA.some((criterion) => ratings[criterion] < 1)) {
      setProblem('Rate all five, from 1 to 5.');
      return;
    }
    setProblem(undefined);
    void onSave({ ...ratings, ...(comment.trim() ? { comment: comment.trim() } : {}) });
  };

  return (
    <Modal
      isOpen={staff !== null}
      onClose={onClose}
      title={staff ? `${staff.fullName}, ${formatMonth(month)}` : 'Rate'}
      description="From 1 (needs support) to 5 (outstanding). The teacher sees their own review; nobody else does."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={isSaving}>
            Save review
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <ul className="flex flex-col gap-3">
          {STAFF_RATING_CRITERIA.map((criterion) => (
            <li key={criterion} className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-bold text-ink">{STAFF_RATING_LABELS[criterion]}</span>
              <RatingStars
                label={STAFF_RATING_LABELS[criterion]}
                value={ratings[criterion]}
                onChange={(value) => setRatings((current) => ({ ...current, [criterion]: value }))}
              />
            </li>
          ))}
        </ul>
        <FormField label="A word for them" hint="What went well, and one thing to work on." isOptional>
          <Textarea rows={3} maxLength={1000} value={comment} onChange={(event) => setComment(event.target.value)} />
        </FormField>
        {problem || error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {problem ?? error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
