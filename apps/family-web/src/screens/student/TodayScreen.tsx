import { useNavigate } from 'react-router-dom';
import { useActivities, useActivityQueue, useStreak } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { ActivityCard, StreakIndicator } from '@evolveiq/domain';
import { Card, EmptyState, ErrorState, LoadingState } from '@evolveiq/ui';

/** A student sees only their own work — the api-client scopes it to them. */
export function TodayScreen() {
  const { user } = useAuth();
  const studentId = user?.linkedStudentIds[0];
  const navigate = useNavigate();

  const assignments = useActivityQueue(studentId ? { studentId } : {});
  const activities = useActivities();
  const streak = useStreak(studentId);

  if (assignments.isLoading || activities.isLoading) return <LoadingState label="Getting your activities" />;
  if (assignments.isError || activities.isError) {
    return <ErrorState onRetry={() => void assignments.refetch()} />;
  }

  const activityById = new Map((activities.data ?? []).map((activity) => [activity.id, activity]));
  const todo = (assignments.data ?? []).filter((assignment) => assignment.status !== 'completed');
  const done = (assignments.data ?? []).filter((assignment) => assignment.status === 'completed');

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-serif text-4xl text-ink">Hello, {firstName}</h1>
        <p className="mt-2 text-base text-ink-muted">
          {todo.length === 0
            ? 'Nothing is waiting for you today.'
            : `You have ${todo.length} ${todo.length === 1 ? 'thing' : 'things'} to do.`}
        </p>
      </header>

      {streak.data ? (
        <Card isPlayful className="px-5 py-5">
          <StreakIndicator streak={streak.data} />
        </Card>
      ) : null}

      <section>
        <h2 className="text-xl font-semibold text-ink">To do</h2>
        {todo.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="All done for now"
            description="When your teacher sets something new, it will show up here."
          />
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {todo.map((assignment) => {
              const activity = activityById.get(assignment.activityId);
              if (!activity) return null;
              return (
                <ActivityCard
                  key={assignment.id}
                  isPlayful
                  activity={activity}
                  assignment={assignment}
                  onStart={() => navigate(`/student/activities/${assignment.id}`)}
                />
              );
            })}
          </ul>
        )}
      </section>

      {done.length > 0 ? (
        <section>
          <h2 className="text-xl font-semibold text-ink">Finished</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {done.map((assignment) => {
              const activity = activityById.get(assignment.activityId);
              if (!activity) return null;
              return (
                <ActivityCard
                  key={assignment.id}
                  isPlayful
                  activity={activity}
                  assignment={assignment}
                />
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
