import { useGrowthAreas, useMyAssignments, useStreak, useStudentLevel, XP_PER_ACTIVITY } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { ACTIVITY_TYPE_LABELS, firstNameOf, GrowthAreaList, relativeDayPhrase } from '@evolveiq/domain';
import { EmptyState, ErrorState, LoadingState, SectionTitle, Sprout, Sun, Target } from '@evolveiq/ui';
import { AssignmentChecklist, type ChecklistItem } from '../../components/AssignmentChecklist';
import { LevelProgress } from '../../components/LevelProgress';
import { StreakFlame } from '../../components/StreakFlame';

/**
 * The student's home: a personal growth companion. A student sees only their
 * own work; every request here is answered for them alone.
 */
export function TodayScreen() {
  const { user } = useAuth();
  const missions = useMyAssignments();
  const streak = useStreak(user?.id);
  const level = useStudentLevel();
  const growthAreas = useGrowthAreas(user?.id);

  if (missions.isLoading) return <LoadingState label="Getting your missions" />;
  if (missions.isError) return <ErrorState onRetry={() => void missions.refetch()} />;

  // Still to do first; within each, the newest first (the order they arrive in).
  const items: ChecklistItem[] = [...(missions.data ?? [])]
    .sort((a, b) => Number(a.isDone) - Number(b.isDone))
    .map((mission) => ({
      id: mission.id,
      title: mission.activity.title,
      isDone: mission.isDone,
      detail: mission.completion
        ? `Finished ${relativeDayPhrase(mission.completion.completedAt)}`
        : ACTIVITY_TYPE_LABELS[mission.activity.content.type],
      href: `/student/activities/${mission.id}`,
      xp: XP_PER_ACTIVITY,
    }));
  const firstName = user ? firstNameOf(user.fullName) : 'there';
  const areas = growthAreas.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl font-black tracking-tight text-ink sm:text-5xl">Hi, {firstName}</h1>
          {level.data ? (
            <p className="mt-1 text-sm font-bold text-iris-600">
              Level {level.data.level} • {level.data.title}
            </p>
          ) : null}
        </div>
        {streak.data ? <StreakFlame days={streak.data.days} /> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          {level.data ? <LevelProgress level={level.data} /> : null}

          <section>
            <SectionTitle icon={Target} iconClassName="text-coral-500">
              Daily missions
            </SectionTitle>
            {items.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={Sun}
                title="All done for now"
                description="When your teacher sets something new, it will show up here."
              />
            ) : (
              <AssignmentChecklist className="mt-4" variant="student" items={items} />
            )}
          </section>
        </div>

        <section className="lg:col-span-5">
          <SectionTitle icon={Sprout} iconClassName="text-jade-500">
            What you are working on
          </SectionTitle>
          {areas.length === 0 && !growthAreas.isLoading ? (
            <EmptyState
              className="mt-4"
              icon={Sprout}
              title="Nothing set yet"
              description="When your school picks something to work on with you, it shows up here."
            />
          ) : (
            <GrowthAreaList className="mt-4" growthAreas={areas} />
          )}
        </section>
      </div>
    </div>
  );
}
