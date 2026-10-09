import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useActivity,
  useActivityQueue,
  useCompleteAssignment,
  useStreak,
  type ActivityResponse,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { ActivityPlayer, StreakIndicator } from '@evolveiq/domain';
import { Button, Card, ErrorState, LoadingState, PageHeader, Sparkles, Star } from '@evolveiq/ui';

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
    // The product's one celebration: it only ever plays here, in answer to a
    // child finishing something.
    return (
      <div className="flex flex-col items-center gap-8 py-6 text-center sm:py-10">
        <div className="relative">
          <span className="flex size-28 animate-celebrate items-center justify-center rounded-[2rem] bg-hero text-white shadow-raised">
            <Star className="size-12" fill="currentColor" strokeWidth={1.5} />
          </span>
          <span aria-hidden="true" className="absolute inset-0 animate-halo rounded-[2rem]" />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Finished</h1>
          <p className="mx-auto mt-3 max-w-prose text-lg text-ink-muted">
            You have finished {activity.data.title}. Your teacher will see it.
          </p>
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-iris-50 px-4 py-1.5 text-sm font-black text-iris-700 ring-1 ring-inset ring-iris-100">
            <Sparkles className="size-4" />+{assignment.xp} XP
          </p>
        </div>
        {streak.data ? (
          <Card isPlayful className="px-6 py-5">
            <StreakIndicator streak={streak.data} />
          </Card>
        ) : null}
        <Button size="lg" isPlayful onClick={() => navigate('/student/today')}>
          Back to today
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader
        title={activity.data.title}
        subtitle={`Set by ${assignment.assignedByName}`}
      />

      <ActivityPlayer
        activity={activity.data}
        isSubmitting={completeAssignment.isPending}
        onComplete={handleComplete}
        onExit={() => navigate('/student/today')}
      />
    </div>
  );
}
