import type { Activity, Assignment } from '@evolveiq/api-client';
import { Badge, Button, Card, Check, Clock, cn } from '@evolveiq/ui';
import { DEVELOPMENT_AREA_ICONS } from './area-icons';
import { DEVELOPMENT_AREA_LABELS } from './labels';
import { formatRelativeDay } from './format-date';

export interface ActivityCardProps {
  activity: Activity;
  assignment?: Assignment;
  onStart?: () => void;
  /** Overrides the action wording, e.g. "Assign" on a teacher's library. */
  actionLabel?: string;
  /** Student-facing lists use the rounder card, larger type and a bigger action. */
  isPlayful?: boolean;
}

export function ActivityCard({
  activity,
  assignment,
  onStart,
  actionLabel,
  isPlayful = false,
}: ActivityCardProps) {
  const isDone = assignment?.status === 'completed';
  const AreaIcon = DEVELOPMENT_AREA_ICONS[activity.area];

  return (
    <Card
      as="li"
      isPlayful={isPlayful}
      className={cn(
        'flex flex-col gap-4 p-5 sm:flex-row sm:items-center',
        isPlayful ? 'sm:gap-6 sm:p-6' : 'sm:gap-5',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center self-start sm:self-center',
          isPlayful ? 'size-14 rounded-2xl' : 'size-11 rounded-xl',
          isDone
            ? 'bg-jade-50 text-jade-600'
            : 'bg-gradient-to-br from-iris-100 to-lilac-100 text-iris-600',
        )}
      >
        {isDone ? (
          <Check className={isPlayful ? 'size-7' : 'size-5'} strokeWidth={2.5} />
        ) : (
          <AreaIcon className={isPlayful ? 'size-7' : 'size-5'} />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <Badge tone={isDone ? 'growth' : 'neutral'}>{DEVELOPMENT_AREA_LABELS[activity.area]}</Badge>
          <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <Clock className="size-3.5" />
            About {activity.estimatedMinutes} minutes
          </span>
          {isDone && assignment?.completedAt ? (
            <span className="text-sm text-jade-700">
              Finished {formatRelativeDay(assignment.completedAt)}
            </span>
          ) : null}
        </div>

        <h3
          className={cn(
            'mt-2 text-ink',
            isPlayful ? 'text-xl font-black tracking-tight' : 'text-base font-bold',
          )}
        >
          {activity.title}
        </h3>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">{activity.description}</p>

        {assignment ? (
          <p className="mt-2 text-sm text-ink-faint">Set by {assignment.assignedByName}</p>
        ) : null}
      </div>

      {onStart ? (
        <Button
          type="button"
          className="shrink-0 self-start sm:self-center"
          size={isPlayful ? 'lg' : 'md'}
          isPlayful={isPlayful}
          variant={isDone ? 'secondary' : 'primary'}
          onClick={onStart}
        >
          {actionLabel ?? (isDone ? 'Look at it again' : 'Start')}
        </Button>
      ) : null}
    </Card>
  );
}
