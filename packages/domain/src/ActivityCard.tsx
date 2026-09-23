import type { Activity, Assignment } from '@evolveiq/api-client';
import { Badge, Button, Card } from '@evolveiq/ui';
import { DEVELOPMENT_AREA_LABELS } from './labels';
import { formatRelativeDay } from './format-date';

export interface ActivityCardProps {
  activity: Activity;
  assignment?: Assignment;
  onStart?: () => void;
  /** Overrides the action wording, e.g. "Assign" on a teacher's library. */
  actionLabel?: string;
  /** Student-facing lists use the softer radius and a larger action. */
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

  return (
    <Card as="li" isPlayful={isPlayful} className="flex flex-col gap-3 px-5 py-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={isDone ? 'growth' : 'neutral'}>
          {DEVELOPMENT_AREA_LABELS[activity.area]}
        </Badge>
        <span className="text-sm text-ink-muted">About {activity.estimatedMinutes} minutes</span>
        {isDone && assignment?.completedAt ? (
          <span className="text-sm text-moss-700">
            Finished {formatRelativeDay(assignment.completedAt)}
          </span>
        ) : null}
      </div>

      <div>
        <h3 className={isPlayful ? 'text-xl font-semibold text-ink' : 'text-base font-medium text-ink'}>
          {activity.title}
        </h3>
        <p className="mt-1 max-w-prose text-sm text-ink-muted">{activity.description}</p>
      </div>

      {assignment ? (
        <p className="text-sm text-ink-faint">Set by {assignment.assignedByName}</p>
      ) : null}

      {onStart ? (
        <div className="pt-1">
          <Button
            type="button"
            size={isPlayful ? 'lg' : 'md'}
            isPlayful={isPlayful}
            variant={isDone ? 'secondary' : 'primary'}
            onClick={onStart}
          >
            {actionLabel ?? (isDone ? 'Look at it again' : 'Start')}
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
