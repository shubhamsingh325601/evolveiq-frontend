import type { ClassDetail, RosterStudent } from '@evolveiq/api-client';
import { SidebarCard } from '@evolveiq/domain';
import { Avatar } from '@evolveiq/ui';

export interface ClassesSidebarCardProps {
  classes: ClassDetail[];
  students: RosterStudent[];
  /** The teacher's own observations still waiting on the psychologist. */
  pendingCount: number;
}

/** A teacher's classes on the rail: who they teach, and what is still with the psychologist. */
export function ClassesSidebarCard({ classes, students, pendingCount }: ClassesSidebarCardProps) {
  return (
    <SidebarCard title="Your classes">
      <div className="flex flex-wrap gap-1.5">
        {classes.map((detail) => (
          <span
            key={detail.class.id}
            className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-inset ring-white/10"
          >
            {detail.class.name}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-2xl font-black leading-none text-white">
          {students.length}
          <span className="ml-1.5 text-sm font-semibold text-white/60">
            {students.length === 1 ? 'student' : 'students'}
          </span>
        </p>
        <div aria-hidden="true" className="flex -space-x-2">
          {students.slice(0, 4).map((student) => (
            <Avatar key={student.id} name={student.fullName} size="sm" className="ring-night" />
          ))}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-white/70">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-honey-400" />
        {pendingCount === 0
          ? 'Nothing waiting on review'
          : `${pendingCount} of your ${pendingCount === 1 ? 'observation is' : 'observations are'} awaiting review`}
      </p>
    </SidebarCard>
  );
}
