import { NavLink } from 'react-router-dom';
import type { FamilyAssignment, Person } from '@evolveiq/api-client';
import { firstNameOf, SidebarCard } from '@evolveiq/domain';
import { Avatar, cn } from '@evolveiq/ui';

export interface ChildrenSidebarCardProps {
  students: Person[];
  assignmentsByChild: Map<string, FamilyAssignment[]>;
}

/** A parent's children on the rail, each with what is still to do, one tap from their dashboard. */
export function ChildrenSidebarCard({ students, assignmentsByChild }: ChildrenSidebarCardProps) {
  return (
    <SidebarCard title="Your children">
      <ul className="-mx-1.5 flex flex-col gap-1">
        {students.map((student) => {
          const toDo = (assignmentsByChild.get(student.id) ?? []).filter((assignment) => !assignment.isDone).length;
          return (
            <li key={student.id}>
              <NavLink
                to={`/parent/children/${student.id}`}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
                    isActive ? 'bg-white/10' : 'hover:bg-white/[0.06]',
                  )
                }
              >
                <Avatar name={student.fullName} size="sm" className="ring-night" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {firstNameOf(student.fullName)}
                </span>
                {toDo > 0 ? (
                  <span className="rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black tabular-nums text-white">
                    {toDo}
                    <span className="sr-only"> {toDo === 1 ? 'activity' : 'activities'} to do</span>
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </SidebarCard>
  );
}
