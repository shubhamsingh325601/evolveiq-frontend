import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActivities, useArchiveActivity, type Activity } from '@evolveiq/api-client';
import {
  ACTIVITY_TYPE_ICONS,
  ACTIVITY_TYPE_LABELS,
  ACTIVITY_TYPES,
  formatDay,
  RecordsTable,
  type RecordsTableColumn,
} from '@evolveiq/domain';
import {
  Archive,
  Badge,
  BookOpen,
  Button,
  buttonClasses,
  ErrorState,
  LayoutGrid,
  Lock,
  PageHeader,
  Plus,
  SegmentedControl,
  StatTile,
} from '@evolveiq/ui';

type View = 'active' | 'archived';

/**
 * The one activity library, shared by every school. Psychologists write,
 * edit and archive (never delete); once an activity has been assigned its
 * type and options are frozen, so changing them means archiving it and
 * writing a new one.
 */
export function ActivityLibraryScreen() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('active');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const active = useActivities();
  const archived = useActivities({ isArchived: true });
  const archiveActivity = useArchiveActivity();

  const shown = view === 'active' ? active : archived;
  if (shown.isError) return <ErrorState onRetry={() => void shown.refetch()} />;

  const library = active.data ?? [];
  const typesCovered = new Set(library.map((activity) => activity.content.type)).size;
  const assignedCount = library.filter((activity) => activity.isAssigned).length;

  const archive = async (activity: Activity) => {
    setError(undefined);
    try {
      await archiveActivity.mutateAsync(activity.id);
      setConfirmingId(null);
    } catch {
      setError(`We could not archive “${activity.title}”. Try again.`);
    }
  };

  const columns: RecordsTableColumn<Activity>[] = [
    {
      id: 'title',
      header: 'Activity',
      sortValue: (activity) => activity.title,
      cell: (activity) => (
        <span className="block min-w-[14rem]">
          <span className="block font-bold text-ink">{activity.title}</span>
          <span className="mt-0.5 line-clamp-2 block max-w-sm text-ink-muted">{activity.content.prompt}</span>
        </span>
      ),
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (activity) => ACTIVITY_TYPE_LABELS[activity.content.type],
      cell: (activity) => (
        <Badge icon={ACTIVITY_TYPE_ICONS[activity.content.type]}>{ACTIVITY_TYPE_LABELS[activity.content.type]}</Badge>
      ),
    },
    {
      id: 'assigned',
      header: 'Assigned',
      isSecondary: true,
      sortValue: (activity) => Number(activity.isAssigned),
      cell: (activity) =>
        activity.isAssigned ? (
          <span className="inline-flex items-center gap-1.5 text-ink-muted">
            <Lock className="size-3.5" />
            Yes, so its options are fixed
          </span>
        ) : (
          <span className="text-ink-faint">Not yet</span>
        ),
    },
    {
      id: 'created',
      header: 'Added',
      align: 'right',
      isSecondary: true,
      sortValue: (activity) => activity.createdAt,
      cell: (activity) => <span className="whitespace-nowrap">{formatDay(activity.createdAt)}</span>,
    },
  ];

  const newActivityLink = (
    <Link to="/activities/new" className={buttonClasses({ size: 'sm' })}>
      <Plus />
      New activity
    </Link>
  );

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Activity library"
        subtitle="One library for every school. Teachers assign from it; you recommend from it when you review."
        actions={newActivityLink}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={BookOpen} label="Activities" value={library.length} detail="Ready to assign" />
        <StatTile
          icon={LayoutGrid}
          tone="lilac"
          label="Types covered"
          value={`${typesCovered} of ${ACTIVITY_TYPES.length}`}
          detail="Activity types in use"
        />
        <StatTile icon={Lock} tone="jade" label="Assigned" value={assignedCount} detail="Set at least once" />
        <StatTile
          icon={Archive}
          tone="honey"
          label="Archived"
          value={archived.data?.length ?? '–'}
          detail="No longer assignable"
        />
      </div>

      <SegmentedControl
        label="Which activities to show"
        value={view}
        onChange={(next) => {
          setView(next);
          setConfirmingId(null);
        }}
        options={[
          { value: 'active' as const, label: 'In use', count: active.data?.length ?? 0 },
          { value: 'archived' as const, label: 'Archived', count: archived.data?.length ?? 0 },
        ]}
      />

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <RecordsTable
        caption={view === 'active' ? 'Activity library' : 'Archived activities'}
        rows={shown.data ?? []}
        columns={columns}
        getRowId={(activity) => activity.id}
        searchableText={(activity) => `${activity.title} ${activity.content.prompt}`}
        searchPlaceholder="Search activities"
        isLoading={shown.isLoading}
        {...(view === 'active' ? { onRowClick: (activity: Activity) => navigate(`/activities/${activity.id}/edit`) } : {})}
        {...(view === 'active'
          ? {
              rowActions: (activity: Activity) =>
                confirmingId === activity.id ? (
                  <span className="inline-flex items-center gap-2">
                    <Button
                      variant="danger-quiet"
                      size="sm"
                      isLoading={archiveActivity.isPending}
                      onClick={() => void archive(activity)}
                    >
                      Archive for good
                    </Button>
                    <Button variant="quiet" size="sm" onClick={() => setConfirmingId(null)}>
                      Keep
                    </Button>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Button variant="quiet" size="sm" onClick={() => navigate(`/activities/${activity.id}/edit`)}>
                      Edit
                    </Button>
                    <Button variant="danger-quiet" size="sm" onClick={() => setConfirmingId(activity.id)}>
                      Archive
                    </Button>
                  </span>
                ),
            }
          : {})}
        emptyTitle={view === 'active' ? 'The library is empty' : 'Nothing archived'}
        emptyDescription={
          view === 'active'
            ? 'Write the first activity and teachers can start assigning it.'
            : 'Archived activities stay here, so past assignments still make sense.'
        }
        {...(view === 'active' ? { emptyAction: newActivityLink } : {})}
      />
    </div>
  );
}
