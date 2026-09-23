import {
  useActivities,
  useActivityQueue,
  useGrowthAreas,
  useStreak,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { GrowthAreaList, StreakIndicator, formatRelativeDay } from '@evolveiq/domain';
import { Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@evolveiq/ui';

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
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My progress"
        subtitle="What you have been working on, and what you have finished."
      />

      {streak.data ? (
        <Card isPlayful className="px-5 py-5">
          <StreakIndicator streak={streak.data} />
        </Card>
      ) : null}

      <section>
        <h2 className="text-xl font-semibold text-ink">What we are working on</h2>
        {(growthAreas.data ?? []).length === 0 ? (
          <EmptyState
            className="mt-4"
            title="Nothing set yet"
            description="Your teacher will add something here soon."
          />
        ) : (
          <GrowthAreaList className="mt-4" growthAreas={growthAreas.data ?? []} />
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-ink">Things you have finished</h2>
        {completed.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="Nothing finished yet"
            description="Finish an activity from today and it will appear here."
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {completed.map((assignment) => {
              const activity = activityById.get(assignment.activityId);
              return (
                <Card as="li" key={assignment.id} isPlayful className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4">
                  <span className="text-base font-medium text-ink">
                    {activity?.title ?? 'Activity'}
                  </span>
                  <span className="text-sm text-moss-700">
                    {assignment.completedAt
                      ? `Finished ${formatRelativeDay(assignment.completedAt)}`
                      : 'Finished'}
                  </span>
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
