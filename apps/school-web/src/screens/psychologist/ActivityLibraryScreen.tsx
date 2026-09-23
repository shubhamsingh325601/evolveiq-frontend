import { Link } from 'react-router-dom';
import { useActivities } from '@evolveiq/api-client';
import type { Activity } from '@evolveiq/api-client';
import {
  ACTIVITY_STEP_LABELS,
  DEVELOPMENT_AREA_LABELS,
  RecordsTable,
  formatDay,
  type RecordsTableColumn,
} from '@evolveiq/domain';
import { Badge, buttonClasses, ErrorState, PageHeader } from '@evolveiq/ui';

export function ActivityLibraryScreen() {
  const activities = useActivities();

  if (activities.isError) return <ErrorState onRetry={() => void activities.refetch()} />;

  const columns: RecordsTableColumn<Activity>[] = [
    {
      id: 'title',
      header: 'Activity',
      sortValue: (activity) => activity.title,
      cell: (activity) => (
        <span>
          <span className="block font-medium text-ink">{activity.title}</span>
          <span className="mt-0.5 block max-w-sm text-ink-muted">{activity.description}</span>
        </span>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      sortValue: (activity) => DEVELOPMENT_AREA_LABELS[activity.area],
      cell: (activity) => <Badge tone="neutral">{DEVELOPMENT_AREA_LABELS[activity.area]}</Badge>,
    },
    {
      id: 'steps',
      header: 'Steps',
      isSecondary: true,
      sortValue: (activity) => activity.steps.length,
      cell: (activity) => (
        <span className="text-ink-muted">
          {activity.steps.map((step) => ACTIVITY_STEP_LABELS[step.kind]).join(', ')}
        </span>
      ),
    },
    {
      id: 'age',
      header: 'Ages',
      isSecondary: true,
      sortValue: (activity) => activity.ageRange,
      cell: (activity) => activity.ageRange,
    },
    {
      id: 'minutes',
      header: 'Minutes',
      align: 'right',
      sortValue: (activity) => activity.estimatedMinutes,
      cell: (activity) => <span className="tabular-nums">{activity.estimatedMinutes}</span>,
    },
    {
      id: 'created',
      header: 'Added',
      align: 'right',
      isSecondary: true,
      sortValue: (activity) => activity.createdAt,
      cell: (activity) => formatDay(activity.createdAt),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Activity library"
        subtitle="Everything that can be assigned to a student."
        actions={
          <Link to="/activities/new" className={buttonClasses({ size: 'sm' })}>
            New activity
          </Link>
        }
      />

      <RecordsTable
        caption="Activity library"
        rows={activities.data ?? []}
        columns={columns}
        getRowId={(activity) => activity.id}
        searchableText={(activity) => `${activity.title} ${activity.description}`}
        searchPlaceholder="Search activities"
        isLoading={activities.isLoading}
        emptyTitle="The library is empty"
        emptyDescription="Write the first activity and teachers can start assigning it."
        emptyAction={
          <Link to="/activities/new" className={buttonClasses({ size: 'sm' })}>
            New activity
          </Link>
        }
      />
    </div>
  );
}
