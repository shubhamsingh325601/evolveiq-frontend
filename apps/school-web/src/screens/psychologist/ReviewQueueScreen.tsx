import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReviewQueue,
  useReviewQueueCounts,
  useSchools,
  type ReviewObservation,
  type ReviewQueueFilters,
} from '@evolveiq/api-client';
import {
  formatRelativeDay,
  OBSERVATION_AREA_LABELS,
  OBSERVATION_STATUS_LABELS,
  RecordsTable,
  type RecordsTableColumn,
} from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  Check,
  CircleAlert,
  ClipboardList,
  ErrorState,
  HeartHandshake,
  Inbox,
  PageHeader,
  Select,
  StatTile,
} from '@evolveiq/ui';
import { REVIEW_FILTERS, type ReviewFilter } from '../../review-filters';

/**
 * The five filters the PRD asks for, each one query against the backend's
 * queue. Every one asks for concerns: something good is a star for the
 * student, and never waits here.
 */
type QueueFilter = ReviewFilter;

const FILTER_QUERIES: Record<QueueFilter, ReviewQueueFilters> = REVIEW_FILTERS;

export function ReviewQueueScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<QueueFilter>('pending');
  const [schoolId, setSchoolId] = useState('');

  const schools = useSchools();
  const bySchool = (query: ReviewQueueFilters): ReviewQueueFilters => (schoolId ? { ...query, schoolId } : query);
  const observations = useReviewQueue(bySchool(FILTER_QUERIES[filter]));
  // The tiles count each filter from the list metadata, so they stay right as you switch.
  const counts = useReviewQueueCounts({
    pending: bySchool(FILTER_QUERIES.pending),
    significant: bySchool(FILTER_QUERIES.significant),
    fromParents: bySchool(FILTER_QUERIES['from-parents']),
    reviewed: bySchool(FILTER_QUERIES.reviewed),
    all: bySchool(FILTER_QUERIES.all),
  });

  if (observations.isError) return <ErrorState onRetry={() => void observations.refetch()} />;

  const schoolNameById = new Map((schools.data ?? []).map((school) => [school.id, school.name]));

  const columns: RecordsTableColumn<ReviewObservation>[] = [
    {
      id: 'student',
      header: 'Student',
      sortValue: (observation) => observation.student.fullName,
      cell: (observation) => (
        <span className="flex items-center gap-3">
          <Avatar name={observation.student.fullName} size="sm" />
          <span className="min-w-0">
            <span className="block font-bold text-ink">{observation.student.fullName}</span>
            {schoolNameById.has(observation.schoolId) ? (
              <span className="block text-xs text-ink-muted">{schoolNameById.get(observation.schoolId)}</span>
            ) : null}
          </span>
        </span>
      ),
    },
    {
      id: 'description',
      header: 'What was noticed',
      className: 'min-w-[10rem] max-w-md md:min-w-[16rem]',
      cell: (observation) => (
        <span className="line-clamp-2 font-serif text-[0.9375rem] leading-6 text-ink">{observation.description}</span>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      isSecondary: true,
      sortValue: (observation) => OBSERVATION_AREA_LABELS[observation.area],
      cell: (observation) => OBSERVATION_AREA_LABELS[observation.area],
    },
    {
      id: 'author',
      header: 'From',
      isSecondary: true,
      sortValue: (observation) => observation.author.fullName,
      cell: (observation) => (
        <span className="whitespace-nowrap">
          {observation.author.fullName}
          <span className="block text-ink-faint">{observation.author.role === 'parent' ? 'Parent' : 'Teacher'}</span>
        </span>
      ),
    },
    {
      id: 'written',
      header: 'Written',
      isSecondary: true,
      sortValue: (observation) => observation.createdAt,
      cell: (observation) => <span className="whitespace-nowrap">{formatRelativeDay(observation.createdAt)}</span>,
    },
    {
      id: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (observation) => observation.status,
      cell: (observation) => (
        // Left-aligned with the other lines once the table stacks into cards on a phone.
        <span className="inline-flex flex-wrap justify-end gap-1.5 [@container(max-width:40rem)]:justify-start">
          {observation.level === 'significant' ? <Badge tone="significant">Significant</Badge> : null}
          <Badge tone={observation.status === 'pending' ? 'pending' : 'reviewed'}>
            {OBSERVATION_STATUS_LABELS[observation.status]}
          </Badge>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Review queue"
        subtitle="Concerns from every school, newest first. Good news becomes a star instead."
      />

      <div role="tablist" aria-label="Filter the queue" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile
          icon={Inbox}
          tone="honey"
          label="Pending"
          value={counts.pending ?? '–'}
          detail="Waiting on a decision"
          isSelected={filter === 'pending'}
          onSelect={() => setFilter('pending')}
        />
        <StatTile
          icon={CircleAlert}
          tone="coral"
          label="Significant"
          value={counts.significant ?? '–'}
          detail="Level set by a teacher"
          isSelected={filter === 'significant'}
          onSelect={() => setFilter('significant')}
        />
        <StatTile
          icon={HeartHandshake}
          tone="lilac"
          label="From parents"
          value={counts.fromParents ?? '–'}
          detail="Written at home"
          isSelected={filter === 'from-parents'}
          onSelect={() => setFilter('from-parents')}
        />
        <StatTile
          icon={Check}
          label="Reviewed"
          value={counts.reviewed ?? '–'}
          detail="Closed with a decision"
          isSelected={filter === 'reviewed'}
          onSelect={() => setFilter('reviewed')}
        />
        <StatTile
          icon={ClipboardList}
          label="Everything"
          value={counts.all ?? '–'}
          detail="Every concern raised"
          isSelected={filter === 'all'}
          onSelect={() => setFilter('all')}
        />
      </div>

      <RecordsTable
        caption="Concerns in the review queue"
        rows={observations.data ?? []}
        columns={columns}
        getRowId={(observation) => observation.id}
        searchableText={(observation) =>
          `${observation.student.fullName} ${observation.description} ${observation.author.fullName}`
        }
        searchPlaceholder="Search the queue"
        toolbar={
          <div className="w-52">
            <label className="sr-only" htmlFor="school-filter">
              School
            </label>
            <Select
              id="school-filter"
              className="h-10 rounded-full"
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value)}
            >
              <option value="">All schools</option>
              {(schools.data ?? []).map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          </div>
        }
        isLoading={observations.isLoading}
        onRowClick={(observation) => navigate(`/review-queue/${observation.id}`)}
        emptyTitle="Nothing in this filter"
        emptyDescription="Switch filters to see the rest of the queue."
      />
    </div>
  );
}
