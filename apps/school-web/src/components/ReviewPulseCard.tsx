import { SidebarCard } from '@evolveiq/domain';

export interface ReviewPulseCardProps {
  pending: number | undefined;
  significantPending: number | undefined;
  total: number | undefined;
}

/** How the review queue stands, on the psychologist's rail. Counts only. */
export function ReviewPulseCard({ pending, significantPending, total }: ReviewPulseCardProps) {
  const waiting = pending ?? 0;
  const everything = total ?? 0;
  const closed = Math.max(0, everything - waiting);
  const percentClosed = everything === 0 ? 0 : Math.round((closed / everything) * 100);

  return (
    <SidebarCard title="Review pulse">
      <p className="text-4xl font-black leading-none text-white">
        {pending ?? '–'}
        <span className="ml-1.5 text-sm font-semibold text-white/60">waiting</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs font-medium text-white/75">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-coral-400" />
        {significantPending ?? 0} flagged significant
      </p>
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-jade-400 to-jade-300"
            style={{ width: `${percentClosed}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/60">
          {closed} of {everything} closed with a decision
        </p>
      </div>
    </SidebarCard>
  );
}
