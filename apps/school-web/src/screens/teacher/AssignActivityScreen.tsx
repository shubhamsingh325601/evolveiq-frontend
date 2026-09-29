import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActivities, useAssignActivity, useStudents } from '@evolveiq/api-client';
import { ActivityCard, DEVELOPMENT_AREA_LABELS, DEVELOPMENT_AREAS } from '@evolveiq/domain';
import type { DevelopmentArea } from '@evolveiq/api-client';
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
  SegmentedControl,
  Select,
} from '@evolveiq/ui';

const todayIsoDate = (): string => new Date().toISOString().slice(0, 10);

/** Direct assignment: a teacher can set an activity without waiting for review. */
export function AssignActivityScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const students = useStudents();
  const [area, setArea] = useState<DevelopmentArea | 'all'>('all');
  const activities = useActivities(area === 'all' ? {} : { area });
  const assignActivity = useAssignActivity();

  const [studentId, setStudentId] = useState(searchParams.get('studentId') ?? '');
  const [dueOn, setDueOn] = useState(todayIsoDate());
  const [assignedTitle, setAssignedTitle] = useState<string>();
  const [error, setError] = useState<string>();

  if (students.isLoading) return <LoadingState label="Loading" />;
  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const chosenStudentId = studentId || (students.data ?? [])[0]?.id || '';

  const assign = async (activityId: string, title: string) => {
    setError(undefined);
    try {
      await assignActivity.mutateAsync({ activityId, studentId: chosenStudentId, dueOn });
      setAssignedTitle(title);
    } catch {
      setError('We could not assign that. Try again.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Assign an activity"
        subtitle="Pick a student, then choose something from the library."
      />

      <Card className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end sm:p-6">
        <FormField label="Student">
          <Select value={chosenStudentId} onChange={(event) => setStudentId(event.target.value)}>
            {(students.data ?? []).map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Due by">
          <Input
            type="date"
            min={todayIsoDate()}
            value={dueOn}
            onChange={(event) => setDueOn(event.target.value)}
          />
        </FormField>
      </Card>

      {assignedTitle ? (
        <div
          role="status"
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-jade-100 bg-jade-50/90 px-5 py-4"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-jade-500 text-white">
            <Check className="size-4" strokeWidth={3} />
          </span>
          <p className="min-w-0 flex-1 text-sm text-jade-700">
            {assignedTitle} is now set for{' '}
            {(students.data ?? []).find((student) => student.id === chosenStudentId)?.name ??
              'the student'}
            .
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/teacher/students/${chosenStudentId}`)}
          >
            Open their profile
          </Button>
        </div>
      ) : null}

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <section>
        <SegmentedControl
          label="Filter the library by area"
          value={area}
          onChange={setArea}
          options={[
            { value: 'all' as const, label: 'All areas' },
            ...DEVELOPMENT_AREAS.map((value) => ({
              value,
              label: DEVELOPMENT_AREA_LABELS[value],
            })),
          ]}
        />

        {activities.isLoading ? <LoadingState /> : null}

        {(activities.data ?? []).length === 0 && !activities.isLoading ? (
          <EmptyState
            className="mt-5"
            icon={BookOpen}
            title="Nothing in the library for that area yet"
            description="Choose another area, or ask your school psychologist to add one."
          />
        ) : (
          <ul className="mt-5 grid gap-3 xl:grid-cols-2">
            {(activities.data ?? []).map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                actionLabel="Assign"
                onStart={() => void assign(activity.id, activity.title)}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
