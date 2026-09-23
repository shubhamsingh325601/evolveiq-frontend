import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useActivity,
  useActivityQueue,
  useCompleteAssignment,
  type ActivityResponse,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { ActivityPlayer, StreakIndicator } from '@evolveiq/domain';
import { useStreak } from '@evolveiq/api-client';
import { Button, Card, ErrorState, LoadingState } from '@evolveiq/ui';

export function ActivityScreen() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const studentId = user?.linkedStudentIds[0];
  const navigate = useNavigate();
  const [isFinished, setIsFinished] = useState(false);

  const queue = useActivityQueue(studentId ? { studentId } : {});
  const assignment = (queue.data ?? []).find((candidate) => candidate.id === assignmentId);
  const activity = useActivity(assignment?.activityId);
  const completeAssignment = useCompleteAssignment();
  const streak = useStreak(studentId);

  if (queue.isLoading || activity.isLoading) return <LoadingState label="Opening the activity" />;
  if (queue.isError || activity.isError || !assignment || !activity.data) {
    return (
      <ErrorState
        title="That activity is not here"
        description="It may have been unassigned. Go back to today and pick another one."
        onRetry={() => navigate('/student/today')}
      />
    );
  }

  const handleComplete = async (responses: ActivityResponse[]) => {
    await completeAssignment.mutateAsync({ assignmentId: assignment.id, responses });
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="flex flex-col gap-8">
        <header>
          <h1 className="font-serif text-4xl text-ink">Finished</h1>
          <p className="mt-2 max-w-prose text-base text-ink-muted">
            You have finished {activity.data.title}. Your teacher will see it.
          </p>
        </header>
        {streak.data ? (
          <Card isPlayful className="px-5 py-5">
            <StreakIndicator streak={streak.data} />
          </Card>
        ) : null}
        <div>
          <Button size="lg" isPlayful onClick={() => navigate('/student/today')}>
            Back to today
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-ink">{activity.data.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">Set by {assignment.assignedByName}</p>
      </header>

      <ActivityPlayer
        activity={activity.data}
        isSubmitting={completeAssignment.isPending}
        onComplete={handleComplete}
        onExit={() => navigate('/student/today')}
      />
    </div>
  );
}
