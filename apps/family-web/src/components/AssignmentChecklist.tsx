import { Link } from 'react-router-dom';
import { Card, Check, cn } from '@evolveiq/ui';

/** One line of the checklist, already worded by the screen that owns the data. */
export interface ChecklistItem {
  id: string;
  title: string;
  isDone: boolean;
  /** e.g. "Finished yesterday", "Set 3 days ago". */
  detail?: string;
  /** Students: where an unfinished mission opens. */
  href?: string;
  /** Students: what finishing it is worth. */
  xp?: number;
}

export interface AssignmentChecklistProps {
  items: ChecklistItem[];
  /**
   * `student` is the Daily Missions list: round checks, XP, and each mission
   * still to do opens in the activity player. `parent` is the read-only list
   * of what their child has been set.
   */
  variant: 'student' | 'parent';
  className?: string;
}

export function AssignmentChecklist({ items, variant, className }: AssignmentChecklistProps) {
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => {
        if (variant === 'parent') {
          return (
            <Card as="li" isPlayful key={item.id} className="flex items-start gap-4 p-4">
              <span
                aria-hidden="true"
                className={cn(
                  'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border-2',
                  item.isDone ? 'border-jade-500 bg-jade-500 text-white' : 'border-line-strong bg-white',
                )}
              >
                {item.isDone ? <Check className="size-3" strokeWidth={3.5} /> : null}
              </span>
              <div className="min-w-0">
                <p className={cn('text-sm font-bold', item.isDone ? 'text-ink-faint line-through' : 'text-ink')}>
                  {item.title}
                  <span className="sr-only">{item.isDone ? ', done' : ', to do'}</span>
                </p>
                {item.detail ? <p className="mt-1 text-[0.6875rem] text-ink-faint">{item.detail}</p> : null}
              </div>
            </Card>
          );
        }

        const href = !item.isDone ? item.href : undefined;
        return (
          <Card
            as="li"
            isPlayful
            key={item.id}
            className={cn(
              'relative flex items-center gap-4 p-4',
              href && 'transition-[border-color,transform] hover:border-iris-200 active:scale-[0.98]',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-full border-2',
                item.isDone ? 'border-jade-500 bg-jade-500 text-white' : 'border-line-strong bg-white',
              )}
            >
              {item.isDone ? <Check className="size-4" strokeWidth={3} /> : null}
            </span>
            <div className="min-w-0 flex-1">
              {href ? (
                <Link
                  to={href}
                  className="text-sm font-bold leading-tight text-ink after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-iris-500"
                >
                  {item.title}
                </Link>
              ) : (
                <p className={cn('text-sm font-bold leading-tight', item.isDone ? 'text-ink-faint line-through' : 'text-ink')}>
                  {item.title}
                  {item.isDone ? <span className="sr-only">, done</span> : null}
                </p>
              )}
              {item.detail ? <p className="mt-0.5 text-[0.6875rem] font-medium text-ink-muted">{item.detail}</p> : null}
            </div>
            {item.xp !== undefined ? (
              <span
                className={cn(
                  'shrink-0 rounded-lg px-2 py-1 text-[0.625rem] font-black',
                  item.isDone ? 'bg-surface-sunk text-ink-faint' : 'bg-iris-50 text-iris-600',
                )}
              >
                +{item.xp} XP
              </span>
            ) : null}
          </Card>
        );
      })}
    </ul>
  );
}
