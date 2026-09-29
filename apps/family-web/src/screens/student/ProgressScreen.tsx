import {
  useActivities,
  useActivityQueue,
  useGrowthAreas,
  useStreak,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { GrowthAreaList, StreakIndicator, formatRelativeDay } from '@evolveiq/domain';
import {
  Card,
  Check,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  Sprout,
  Star,
} from '@evolveiq/ui';

export function ProgressScreen() {
  const { user } = useAuth();
  const studentId = user?.linkedStudentIds[0];

  const streak = useStreak(studentId);
  const growthAreas = useGrowthAreas(studentId);
  const assignments = useActivityQueue(studentId ? { studentId, status: 'completed' } : {});
  const activities = useActivities();

  if (streak.isLoading || growthAreas.isLoading || assignments.isLoading) {
    return <LoadingState label="Working out your progress" />;
  }
  if (streak.isError || growthAreas.isError || assignments.isError) {
    return <ErrorState onRetry={() => void streak.refetch()} />;
  }

  const activityById = new Map((activities.data ?? []).map((activity) => [activity.id, activity]));
  const completed = assignments.data ?? [];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="My progress"
        subtitle="What you have been working on, and what you have finished."
      />

      {streak.data ? (
        <Card isPlayful className="flex flex-wrap items-center justify-between gap-6 p-6">
          <StreakIndicator streak={streak.data} />
          {streak.data.longestStreak > 0 ? (
            <div className="sm:text-right">
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-ink">
                {streak.data.longestStreak}
              </p>
              <p className="text-sm text-ink-muted">
                {streak.data.longestStreak === 1 ? 'day' : 'days'}, your longest run
              </p>
            </div>
          ) : null}
        </Card>
      ) : null}

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">What we are working on</h2>
        {(growthAreas.data ?? []).length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Sprout}
            title="Nothing set yet"
            description="Your teacher will add something here soon."
          />
        ) : (
          <GrowthAreaList className="mt-4 md:grid-cols-2" growthAreas={growthAreas.data ?? []} />
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Things you have finished</h2>
        {completed.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Star}
            title="Nothing finished yet"
            description="Finish an activity from today and it will appear here."
          />
        ) : (
          <Card isPlayful className="mt-4 overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {completed.map((assignment) => {
                const activity = activityById.get(assignment.activityId);
                return (
                  <li key={assignment.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-jade-500 text-white shadow-[0_6px_16px_-6px_rgba(31,168,120,0.8)]">
                      <Check className="size-5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 text-base font-medium text-ink">
                      {activity?.title ?? 'Activity'}
                    </span>
                    <span className="text-sm text-jade-700">
                      {assignment.completedAt
                        ? `Finished ${formatRelativeDay(assignment.completedAt)}`
                        : 'Finished'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
