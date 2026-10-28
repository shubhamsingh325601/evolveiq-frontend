import { Link } from 'react-router-dom';
import type { Person } from '@evolveiq/api-client';
import { firstNameOf } from '@evolveiq/domain';
import { cn } from '@evolveiq/ui';

export interface ChildSwitcherProps {
  students: Person[];
  currentChildId: string;
  /** Where a pill leads: the child's dashboard unless the page says otherwise (Explore keeps you in Explore). */
  pathFor?: (childId: string) => string;
}

const dashboardPath = (childId: string) => `/parent/children/${childId}`;

/** One pill per child across the top of a parent's page; the dark one is open. */
export function ChildSwitcher({ students, currentChildId, pathFor = dashboardPath }: ChildSwitcherProps) {
  return (
    <nav
      aria-label="Your children"
      className="-mx-4 overflow-x-auto px-4 py-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden"
    >
      <ul className="flex gap-3">
        {students.map((student) => {
          const isCurrent = student.id === currentChildId;
          return (
            <li key={student.id} className="shrink-0">
              <Link
                to={pathFor(student.id)}
                aria-current={isCurrent ? 'page' : undefined}
                className={cn(
                  'inline-flex h-10 items-center whitespace-nowrap rounded-full border px-5 text-xs font-bold shadow-card transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
                  isCurrent
                    ? 'border-transparent bg-night text-white'
                    : 'border-line bg-white/90 text-ink-muted hover:text-ink',
                )}
              >
                {firstNameOf(student.fullName)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
