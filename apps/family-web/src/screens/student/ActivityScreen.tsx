import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  businessDate,
  isApiError,
  lastSevenDays,
  useCompleteAssignment,
  useMyAssignments,
  useStreak,
  XP_PER_ACTIVITY,
  type ActivityAnswer,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { ActivityPlayer, BackLink, describeAnswer, relativeDayPhrase, StreakIndicator } from '@evolveiq/domain';
import { Button, Card, Check, ErrorState, LoadingState, PageHeader, Quote, Sparkles, Star } from '@evolveiq/ui';

export function ActivityScreen() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const missions = useMyAssignments();
  const completeAssignment = useCompleteAssignment();
  const streak = useStreak(user?.id);
  const [isFinished, setIsFinished] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  if (missions.isLoading) return <LoadingState label="Opening the activity" />;
  const mission = (missions.data ?? []).find((candidate) => candidate.id === assignmentId);
  if (missions.isError || !mission) {
    return (
      <ErrorState
        title="That activity is not here"
        description="Go back to today and pick another one."
        onRetry={() => navigate('/student/today')}
      />
    );
  }

  const finishedDays = (missions.data ?? []).flatMap((candidate) =>
    candidate.completion ? [businessDate(candidate.completion.completedAt)] : [],
  );

  const handleComplete = async (answer: ActivityAnswer) => {
    setSubmitError(undefined);
    try {
      await completeAssignment.mutateAsync({ assignmentId: mission.id, answer });
      setIsFinished(true);
    } catch (error) {
      setSubmitError(
        isApiError(error) && error.status === 409
          ? 'You have already finished this one.'
          : 'We could not save your answer. Check your connection and try again.',
      );
    }
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
            You have finished {mission.activity.title}. Your teacher will see it.
          </p>
          <p className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-iris-50 px-4 py-1.5 text-sm font-black text-iris-700 ring-1 ring-inset ring-iris-100">
            <Sparkles className="size-4" />+{XP_PER_ACTIVITY} XP
          </p>
        </div>
        {streak.data ? (
          <Card isPlayful className="px-6 py-5">
            <StreakIndicator days={streak.data.days} lastSevenDays={lastSevenDays(finishedDays, businessDate())} />
          </Card>
        ) : null}
        <Button size="lg" isPlayful onClick={() => navigate('/student/today')}>
          Back to today
        </Button>
      </div>
    );
  }

  if (mission.completion) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <BackLink to="/student/today" className="self-start">
          Today
        </BackLink>
        <PageHeader title={mission.activity.title} subtitle={`You finished this ${relativeDayPhrase(mission.completion.completedAt)}.`} />
        <Card isPlayful className="flex flex-col gap-4 p-6 sm:p-8">
          <p className="text-lg font-bold text-ink">{mission.activity.content.prompt}</p>
          <div className="flex items-start gap-3">
            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-jade-500 text-white">
              <Check className="size-4" strokeWidth={3} />
            </span>
            <Quote>{describeAnswer(mission.completion.answer, mission.activity.content)}</Quote>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader back={<BackLink to="/student/today">Today</BackLink>} title={mission.activity.title} />

      <ActivityPlayer
        activity={mission.activity}
        isSubmitting={completeAssignment.isPending}
        onComplete={handleComplete}
        onExit={() => navigate('/student/today')}
        {...(submitError ? { submitError } : {})}
      />
    </div>
  );
}
