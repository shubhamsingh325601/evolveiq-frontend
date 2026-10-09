import { SidebarCard } from '@evolveiq/domain';

export interface OverviewSidebarCardProps {
  title: string;
  /** The place these counts describe, such as a school's name and city. */
  heading: string;
  counts: { label: string; value: number }[];
}

/** An admin's patch at a glance on the rail: the school, or the whole platform, in counts. */
export function OverviewSidebarCard({ title, heading, counts }: OverviewSidebarCardProps) {
  return (
    <SidebarCard title={title}>
      <p className="text-base font-black leading-tight text-white">{heading}</p>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        {counts.map((count) => (
          <div key={count.label} className="rounded-xl bg-white/[0.06] px-2 py-2 text-center">
            <dt className="text-[0.625rem] font-semibold text-white/55">{count.label}</dt>
            <dd className="mt-0.5 text-lg font-black tabular-nums text-white">{count.value}</dd>
          </div>
        ))}
      </dl>
    </SidebarCard>
  );
}
