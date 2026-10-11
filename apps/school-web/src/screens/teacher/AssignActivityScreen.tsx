import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActivities, useAssignActivity, useClassRoster, type ActivityType } from '@evolveiq/api-client';
import { ACTIVITY_TYPE_LABELS, ACTIVITY_TYPES, ActivityCard } from '@evolveiq/domain';
import {
  BookOpen,
  Button,
  Card,
  Check,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  PageHeader,
  Search,
  SectionTitle,
  SegmentedControl,
  Select,
  UsersRound,
} from '@evolveiq/ui';

/** Direct assignment: a teacher can set an activity without waiting for a review. */
export function AssignActivityScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roster = useClassRoster();
  const [type, setType] = useState<ActivityType | 'all'>('all');
  const [search, setSearch] = useState('');
  const activities = useActivities(type === 'all' ? {} : { type });
  const assignActivity = useAssignActivity();

  const [studentId, setStudentId] = useState(searchParams.get('studentId') ?? '');
  const [assigned, setAssigned] = useState<{ title: string; studentId: string }>();
  const [error, setError] = useState<string>();

  if (roster.isLoading) return <LoadingState label="Loading" />;
  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  const chosenStudentId = studentId || roster.students[0]?.id || '';
  const nameOf = (id: string) => roster.students.find((student) => student.id === id)?.fullName ?? 'the student';
  const needle = search.trim().toLowerCase();
  const library = (activities.data ?? []).filter((activity) => !needle || activity.title.toLowerCase().includes(needle));

  const assign = async (activityId: string, title: string) => {
    setError(undefined);
    setAssigned(undefined);
    try {
      await assignActivity.mutateAsync({ activityId, studentId: chosenStudentId });
      setAssigned({ title, studentId: chosenStudentId });
    } catch {
      setError('We could not assign that. The activity may have been archived; refresh and try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Assign an activity" subtitle="Pick a student, then choose something from the library." />

      <Card isPlayful className="grid gap-5 p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-black tracking-tight text-ink">
          <UsersRound className="size-5 text-iris-500" />
          Who it is for
        </h2>
        <FormField label="Student">
          <Select value={chosenStudentId} onChange={(event) => setStudentId(event.target.value)}>
            {roster.students.length === 0 ? <option value="">No students in your classes</option> : null}
            {roster.students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.fullName}, {student.className}
              </option>
            ))}
          </Select>
        </FormField>
      </Card>

      {assigned ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-jade-100 bg-jade-50/90 px-5 py-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-jade-500 text-white">
            <Check className="size-4" strokeWidth={3} />
          </span>
          <p className="min-w-0 flex-1 text-sm text-jade-700">
            {assigned.title} is now set for {nameOf(assigned.studentId)}.
          </p>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/teacher/students/${assigned.studentId}`)}>
            Open their profile
          </Button>
        </div>
      ) : null}

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <section className="flex flex-col gap-4">
        <SectionTitle icon={BookOpen}>From the library</SectionTitle>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SegmentedControl
            label="Filter the library by type"
            value={type}
            onChange={setType}
            options={[
              { value: 'all' as const, label: 'All types' },
              ...ACTIVITY_TYPES.map((value) => ({ value, label: ACTIVITY_TYPE_LABELS[value] })),
            ]}
          />
          <div className="lg:w-72">
            <label className="sr-only" htmlFor="library-search">
              Search the library
            </label>
            <Input
              id="library-search"
              type="search"
              leadingIcon={Search}
              value={search}
              placeholder="Search by title"
              className="h-10 rounded-full"
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {activities.isLoading ? <LoadingState /> : null}

        {library.length === 0 && !activities.isLoading ? (
          <EmptyState
            className="mt-5"
            icon={BookOpen}
            title="Nothing in the library matches"
            description="Choose another type, clear the search, or ask your school psychologist to add one."
          />
        ) : (
          <ul className="mt-1 grid gap-3 xl:grid-cols-2">
            {library.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                actionLabel="Assign"
                isActionDisabled={!chosenStudentId || assignActivity.isPending}
                onStart={() => void assign(activity.id, activity.title)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
