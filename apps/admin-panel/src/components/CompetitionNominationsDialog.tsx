import type { Competition } from '@evolveiq/api-client';
import { Button, CircleAlert, Modal, Trash2, UserX } from '@evolveiq/ui';

export interface CompetitionNominationsDialogProps {
  isOpen: boolean;
  /** The competition whose nominations are shown; leave it out while closing. */
  competition: Competition | null;
  onClose: () => void;
  onRemove: (studentId: string) => void;
  /** Whether the row for this student is mid-removal. */
  isRemoving?: (studentId: string) => boolean;
  error?: string | undefined;
}

/**
 * Who a school's competition has nominated so far — School Admin (own
 * school) and Platform Admin may remove any teacher's nomination; the
 * school-wide leaderboard the client's prototype hinted at has no backend
 * endpoint, so this stays a plain list, nothing ranked or counted beyond it.
 */
export function CompetitionNominationsDialog({ isOpen, competition, onClose, onRemove, isRemoving, error }: CompetitionNominationsDialogProps) {
  const nominations = competition?.nominations ?? [];
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={competition ? `Nominations for “${competition.title}”` : 'Nominations'}
      description="Every student entered, and who nominated them."
      footer={
        <Button variant="quiet" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
        {nominations.length === 0 ? (
          <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
            <UserX className="size-4 shrink-0" />
            No one has been nominated for this yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {nominations.map((nomination) => (
              <li
                key={nomination.studentId}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/80 px-3.5 py-2.5 ring-1 ring-inset ring-line"
              >
                <span className="min-w-0">
                  <span className="block font-bold text-ink">{nomination.studentName}</span>
                  <span className="block text-xs text-ink-muted">Nominated by {nomination.nominatedBy.fullName}</span>
                </span>
                <Button
                  variant="danger-quiet"
                  size="sm"
                  icon={Trash2}
                  isLoading={isRemoving?.(nomination.studentId) ?? false}
                  onClick={() => onRemove(nomination.studentId)}
                  aria-label={`Remove ${nomination.studentName} from “${competition?.title ?? 'this competition'}”`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
