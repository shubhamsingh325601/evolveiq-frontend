import { Link } from 'react-router-dom';
import type { Activity, Assignment } from '@evolveiq/api-client';
import { formatRelativeDay } from '@evolveiq/domain';
import { Card, Check, cn } from '@evolveiq/ui';

export interface AssignmentChecklistItem {
  assignment: Assignment;
  activity: Activity;
}

export interface AssignmentChecklistProps {
  items: AssignmentChecklistItem[];
  /**
   * `student` is the Daily Missions list: round checks, XP, and each mission
   * still to do opens in the activity player. `parent` is the read-only list
   * of what their child has been set.
   */
  variant: 'student' | 'parent';
  /** Where a student's unfinished mission opens. */
  linkFor?: (assignment: Assignment) => string;
  className?: string;
}

function finishedLabel(assignment: Assignment): string {
  return assignment.completedAt ? `Finished ${formatRelativeDay(assignment.completedAt)}` : 'Finished';
}

export function AssignmentChecklist({ items, variant, linkFor, className }: AssignmentChecklistProps) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map(({ assignment, activity }) => {
        const isDone = assignment.status === 'completed';

        if (variant === 'parent') {
          return (
            <Card as="li" isPlayful key={assignment.id} className="flex items-start gap-4 p-4">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border-2',
                  isDone ? 'border-jade-500 bg-jade-500 text-white' : 'border-line-strong bg-white',
                )}
              >
                {isDone ? <Check className="size-3" strokeWidth={3.5} /> : null}
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm font-bold', isDone ? 'text-ink-faint line-through' : 'text-ink')}>
                  {activity.title}
                  <span className="sr-only">{isDone ? ', done' : ', to do'}</span>
                </p>
                <p className="mt-1 text-xs text-ink-muted">{activity.description}</p>
                <p className="mt-1.5 text-[0.6875rem] text-ink-faint">
                  {isDone ? finishedLabel(assignment) : `Set by ${assignment.assignedByName}`}
                </p>
              </div>
            </Card>
          );
        }

        const href = !isDone && linkFor ? linkFor(assignment) : undefined;
        return (
          <Card
            as="li"
            isPlayful
            key={assignment.id}
            className={cn(
              'relative flex items-center gap-4 p-4',
              href && 'transition-[border-color,transform] hover:border-iris-200 active:scale-[0.98]',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                isDone ? 'border-jade-500 bg-jade-500 text-white' : 'border-line-strong bg-white',
              )}
            >
              {isDone ? <Check className="size-4" strokeWidth={3} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              {href ? (
                <Link
                  to={href}
                  className="text-sm font-bold leading-tight text-ink after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-iris-500"
                >
                  {activity.title}
                </Link>
              ) : (
                <p
                  className={cn(
                    'text-sm font-bold leading-tight',
                    isDone ? 'text-ink-faint line-through' : 'text-ink',
                  )}
                >
                  {activity.title}
                  {isDone ? <span className="sr-only">, done</span> : null}
                </p>
              )}
              <p className="mt-0.5 text-[0.6875rem] font-medium text-ink-muted">
                {isDone ? finishedLabel(assignment) : `About ${activity.estimatedMinutes} min`}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-lg px-2 py-1 text-[0.625rem] font-black',
                isDone ? 'bg-surface-sunk text-ink-faint' : 'bg-iris-50 text-iris-600',
              )}
            >
              +{assignment.xp} XP
            </span>
          </Card>
        );
      })}
    </ul>
  );
}
