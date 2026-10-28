import {
  businessDate,
  lastSevenDays,
  FEATURES,
  longestRun,
  useGrowthAreas,
  useGrowthMoments,
  useHolisticIndex,
  useMyAssignments,
  useStars,
  useStreak,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import {
  GrowthAreaList,
  GrowthMoments,
  HolisticIndexCard,
  HolisticTrendCard,
  relativeDayPhrase,
  StarBoard,
  StarsOverTime,
  StreakIndicator,
} from '@evolveiq/domain';
import { Link } from 'react-router-dom';
import { buttonClasses, Card, Check, ChevronRight, EmptyState, ErrorState, LoadingState, PageHeader, Sprout, Star } from '@evolveiq/ui';

/** The student's progress, graphs first (client feedback, 28 Oct 2026): score and trajectory, stars by month and the streak, then the detail. */
export function ProgressScreen() {
  const { user } = useAuth();
  const streak = useStreak(user?.id);
  const growthAreas = useGrowthAreas(user?.id);
  const missions = useMyAssignments();
  const stars = useStars(user?.id);
  const holistic = useHolisticIndex(user?.id);
  const moments = useGrowthMoments(user?.id);

  if (streak.isLoading || growthAreas.isLoading || missions.isLoading) {
    return <LoadingState label="Working out your progress" />;
  }
  if (streak.isError || growthAreas.isError || missions.isError) {
    return <ErrorState onRetry={() => void missions.refetch()} />;
  }

  const finished = (missions.data ?? []).flatMap((mission) =>
    mission.completion ? [{ ...mission, completedAt: mission.completion.completedAt }] : [],
  );
  const finishedDays = finished.map((mission) => businessDate(mission.completedAt));
  const longest = longestRun(finishedDays);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="My progress"
        subtitle="Your stars, what you have been working on, and what you have finished."
      />

      {FEATURES.holisticIndex && holistic.data && user ? (
        <div className="flex flex-col gap-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <HolisticIndexCard studentName={user.fullName} index={holistic.data} />
            <HolisticTrendCard studentName={user.fullName} index={holistic.data} />
          </div>
          <Link to="/student/report" className={buttonClasses({ size: 'sm', variant: 'secondary', className: 'self-start' })}>
            See my full report
            <ChevronRight />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <StarsOverTime stars={stars.data ?? []} audience="student" />
        <Card isPlayful className="flex flex-wrap items-center justify-between gap-6 p-6">
          <StreakIndicator days={streak.data?.days ?? 0} lastSevenDays={lastSevenDays(finishedDays, businessDate())} />
          {longest > 0 ? (
            <div className="sm:text-right">
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-ink">{longest}</p>
              <p className="text-sm text-ink-muted">{longest === 1 ? 'day' : 'days'}, your longest run</p>
            </div>
          ) : null}
        </Card>
      </div>

      <StarBoard stars={stars.data ?? []} audience="student" isLoading={stars.isLoading} limit={5} />

      <GrowthMoments moments={moments.data ?? []} audience="student" isLoading={moments.isLoading} />

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">What we are working on</h2>
        {(growthAreas.data ?? []).length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Sprout}
            title="Nothing set yet"
            description="Your school will add something here soon."
          />
        ) : (
          <GrowthAreaList className="mt-4 md:grid-cols-2" growthAreas={growthAreas.data ?? []} />
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight text-ink">Things you have finished</h2>
        {finished.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Star}
            title="Nothing finished yet"
            description="Finish an activity from today and it will appear here."
          />
        ) : (
          <Card isPlayful className="mt-4 overflow-hidden">
            <ul className="divide-y divide-line-soft">
              {[...finished]
                .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
                .map((mission) => (
                  <li key={mission.id} className="flex items-center gap-4 px-6 py-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-jade-500 text-white shadow-[0_6px_16px_-6px_rgba(31,168,120,0.8)]">
                      <Check className="size-5" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 text-base font-medium text-ink">{mission.activity.title}</span>
                    <span className="text-sm text-jade-700">Finished {relativeDayPhrase(mission.completedAt)}</span>
                  </li>
                ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
