import { NavLink } from 'react-router-dom';
import type { HolisticIndex, Student } from '@evolveiq/api-client';
import { changeSinceLastYear, firstNameOf, SidebarCard } from '@evolveiq/domain';
import { ArrowUp, Avatar, cn } from '@evolveiq/ui';

export interface ChildrenSidebarCardProps {
  students: Student[];
  indexes: Map<string, HolisticIndex>;
}

/** A parent's children on the rail, each with their EvolvIQ Holistic Index, one tap from their dashboard. */
export function ChildrenSidebarCard({ students, indexes }: ChildrenSidebarCardProps) {
  return (
    <SidebarCard title="Your children">
      <ul className="-mx-1.5 flex flex-col gap-1">
        {students.map((student) => {
          const index = indexes.get(student.id);
          const change = index ? changeSinceLastYear(index) : null;
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
                <Avatar name={student.name} size="sm" className="ring-night" />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {firstNameOf(student.name)}
                </span>
                {index ? (
                  <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-black tabular-nums text-jade-300">
                    {change !== null && change > 0 ? (
                      <ArrowUp aria-hidden="true" className="size-3" strokeWidth={3} />
                    ) : null}
                    {index.score}
                    <span className="sr-only"> EvolvIQ Holistic Index</span>
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
