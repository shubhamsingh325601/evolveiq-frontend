import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useObservations, useSchools, useStudents } from '@evolveiq/api-client';
import type { Observation, ReviewQueueFilters } from '@evolveiq/api-client';
import {
  DEVELOPMENT_AREA_LABELS,
  OBSERVATION_STATUS_LABELS,
  RecordsTable,
  formatRelativeDay,
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

/** The five filters the PRD asks for, as one switch over the same query. */
type QueueFilter = 'pending' | 'significant' | 'from-parents' | 'reviewed' | 'all';

const FILTER_QUERIES: Record<QueueFilter, ReviewQueueFilters> = {
  pending: { status: 'pending' },
  significant: { isSignificant: true },
  'from-parents': { authorRole: 'parent' },
  reviewed: { status: 'reviewed' },
  all: {},
};

export function ReviewQueueScreen() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<QueueFilter>('pending');
  const [schoolId, setSchoolId] = useState('');

  const schools = useSchools();
  const students = useStudents();
  const observations = useObservations({
    ...FILTER_QUERIES[filter],
    ...(schoolId ? { schoolId } : {}),
  });

  // Counts come from the unfiltered set so the tabs stay stable as you switch.
  const allObservations = useObservations(schoolId ? { schoolId } : {});
  const all = allObservations.data ?? [];

  if (observations.isError) return <ErrorState onRetry={() => void observations.refetch()} />;

  const nameById = new Map((students.data ?? []).map((student) => [student.id, student.name]));

  const columns: RecordsTableColumn<Observation>[] = [
    {
      id: 'student',
      header: 'Student',
      sortValue: (observation) => nameById.get(observation.studentId) ?? '',
      cell: (observation) => {
        const name = nameById.get(observation.studentId) ?? 'Unknown student';
        return (
          <span className="flex items-center gap-3">
            <Avatar name={name} size="sm" />
            <span className="font-bold text-ink">{name}</span>
          </span>
        );
      },
    },
    {
      id: 'body',
      header: 'What was noticed',
      className: 'min-w-[10rem] max-w-md md:min-w-[16rem]',
      cell: (observation) => (
        <span className="line-clamp-2 font-serif text-[0.9375rem] leading-6 text-ink">
          {observation.body}
        </span>
      ),
    },
    {
      id: 'area',
      header: 'Area',
      isSecondary: true,
      sortValue: (observation) => DEVELOPMENT_AREA_LABELS[observation.area],
      cell: (observation) => DEVELOPMENT_AREA_LABELS[observation.area],
    },
    {
      id: 'author',
      header: 'From',
      isSecondary: true,
      sortValue: (observation) => observation.authorName,
      cell: (observation) => (
        <span className="whitespace-nowrap">
          {observation.authorName}
          <span className="block text-ink-faint">
            {observation.authorRole === 'parent' ? 'Parent' : 'Teacher'}
          </span>
        </span>
      ),
    },
    {
      id: 'observed',
      header: 'Seen',
      isSecondary: true,
      sortValue: (observation) => observation.observedAt,
      cell: (observation) => (
        <span className="whitespace-nowrap">{formatRelativeDay(observation.observedAt)}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (observation) => observation.status,
      cell: (observation) => (
        <span className="inline-flex flex-wrap justify-end gap-1.5">
          {observation.isSignificant ? <Badge tone="significant">Significant</Badge> : null}
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
        subtitle="Observations waiting on you, newest first."
      />

      <div role="tablist" aria-label="Filter the queue" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <StatTile
          icon={Inbox}
          tone="honey"
          label="Pending"
          value={all.filter((entry) => entry.status === 'pending').length}
          detail="Waiting on a decision"
          isSelected={filter === 'pending'}
          onSelect={() => setFilter('pending')}
        />
        <StatTile
          icon={CircleAlert}
          tone="coral"
          label="Significant"
          value={all.filter((entry) => entry.isSignificant).length}
          detail="Flagged by a teacher"
          isSelected={filter === 'significant'}
          onSelect={() => setFilter('significant')}
        />
        <StatTile
          icon={HeartHandshake}
          tone="lilac"
          label="From parents"
          value={all.filter((entry) => entry.authorRole === 'parent').length}
          detail="Written at home"
          isSelected={filter === 'from-parents'}
          onSelect={() => setFilter('from-parents')}
        />
        <StatTile
          icon={Check}
          label="Reviewed"
          value={all.filter((entry) => entry.status === 'reviewed').length}
          detail="Closed with a decision"
          isSelected={filter === 'reviewed'}
          onSelect={() => setFilter('reviewed')}
        />
        <StatTile
          icon={ClipboardList}
          label="Everything"
          value={all.length}
          detail="Every observation"
          isSelected={filter === 'all'}
          onSelect={() => setFilter('all')}
        />
      </div>

      <RecordsTable
        caption="Observations awaiting review"
        rows={observations.data ?? []}
        columns={columns}
        getRowId={(observation) => observation.id}
        searchableText={(observation) =>
          `${nameById.get(observation.studentId) ?? ''} ${observation.body} ${observation.authorName}`
        }
        searchPlaceholder="Search the queue"
        toolbar={
          <div className="w-48">
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
