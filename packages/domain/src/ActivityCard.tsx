import type { Activity } from '@evolveiq/api-client';
import { Badge, Button, Card, cn } from '@evolveiq/ui';
import { ACTIVITY_TYPE_ICONS } from './area-icons';
import { ACTIVITY_TYPE_LABELS } from './labels';

export interface ActivityCardProps {
  activity: Pick<Activity, 'title' | 'content'>;
  onStart?: () => void;
  /** Overrides the action wording, e.g. "Assign" on a teacher's library. */
  actionLabel?: string;
  isActionDisabled?: boolean;
  /** A line under the question, such as who it was just set for. */
  note?: string;
  /** Student-facing lists use the rounder card, larger type and a bigger action. */
  isPlayful?: boolean;
}

/** One activity from the library: its type, title and the question it asks. */
export function ActivityCard({
  activity,
  onStart,
  actionLabel,
  isActionDisabled = false,
  note,
  isPlayful = false,
}: ActivityCardProps) {
  const TypeIcon = ACTIVITY_TYPE_ICONS[activity.content.type];

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
          'flex shrink-0 items-center justify-center self-start bg-gradient-to-br from-iris-100 to-lilac-100 text-iris-600 sm:self-center',
          isPlayful ? 'size-14 rounded-2xl' : 'size-11 rounded-xl',
        )}
      >
        <TypeIcon className={isPlayful ? 'size-7' : 'size-5'} />
      </span>

      <div className="min-w-0 flex-1">
        <Badge tone="neutral">{ACTIVITY_TYPE_LABELS[activity.content.type]}</Badge>
        <h3 className={cn('mt-2 text-ink', isPlayful ? 'text-xl font-black tracking-tight' : 'text-base font-bold')}>
          {activity.title}
        </h3>
        <p className="mt-1 line-clamp-2 max-w-prose text-sm text-ink-muted">{activity.content.prompt}</p>
        {note ? <p className="mt-2 text-sm text-jade-700">{note}</p> : null}
      </div>

      {onStart ? (
        <Button
          type="button"
          className="shrink-0 self-start sm:self-center"
          size={isPlayful ? 'lg' : 'md'}
          isPlayful={isPlayful}
          disabled={isActionDisabled}
          onClick={onStart}
        >
          {actionLabel ?? 'Start'}
        </Button>
      ) : null}
    </Card>
  );
}
