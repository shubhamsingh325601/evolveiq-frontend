import type { Observation } from '@evolveiq/api-client';
import { SidebarCard } from '@evolveiq/domain';

export interface ReviewPulseCardProps {
  observations: Observation[];
}

/** How the review queue stands, on the psychologist's rail. */
export function ReviewPulseCard({ observations }: ReviewPulseCardProps) {
  const pending = observations.filter((entry) => entry.status === 'pending');
  const significant = pending.filter((entry) => entry.isSignificant);
  const closed = observations.length - pending.length;
  const percentClosed = observations.length === 0 ? 0 : Math.round((closed / observations.length) * 100);

  return (
    <SidebarCard title="Review pulse">
      <p className="text-4xl font-black leading-none text-white">
        {pending.length}
        <span className="ml-1.5 text-sm font-semibold text-white/60">waiting</span>
      </p>
      <p className="mt-2 flex items-center gap-2 text-xs font-medium text-white/75">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-coral-400" />
        {significant.length} flagged significant
      </p>
      <div className="mt-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-jade-400 to-jade-300"
            style={{ width: `${percentClosed}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/60">
          {closed} of {observations.length} closed with a decision
        </p>
      </div>
    </SidebarCard>
  );
}
