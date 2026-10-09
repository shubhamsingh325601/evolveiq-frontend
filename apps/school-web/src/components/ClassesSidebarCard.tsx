import type { ClassGroup, Observation, Student } from '@evolveiq/api-client';
import { SidebarCard } from '@evolveiq/domain';
import { Avatar } from '@evolveiq/ui';

export interface ClassesSidebarCardProps {
  classes: ClassGroup[];
  students: Student[];
  pending: Observation[];
}

/** A teacher's classes on the rail: who they teach, and what is still with the psychologist. */
export function ClassesSidebarCard({ classes, students, pending }: ClassesSidebarCardProps) {
  return (
    <SidebarCard title="Your classes">
      <div className="flex flex-wrap gap-1.5">
        {classes.map((group) => (
          <span
            key={group.id}
            className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-bold text-white ring-1 ring-inset ring-white/10"
          >
            {group.name}
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
            <Avatar key={student.id} name={student.name} size="sm" className="ring-night" />
          ))}
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs font-medium text-white/70">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-honey-400" />
        {pending.length === 0
          ? 'Nothing waiting on review'
          : `${pending.length} ${pending.length === 1 ? 'observation' : 'observations'} awaiting review`}
      </p>
    </SidebarCard>
  );
}
