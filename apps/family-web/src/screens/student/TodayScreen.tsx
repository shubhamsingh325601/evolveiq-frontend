import { Link } from 'react-router-dom';
import {
  addMonths,
  businessMonth,
  FEATURES,
  useGrowthAreas,
  useHolisticIndex,
  useHonours,
  useMyAssignments,
  useNotices,
  useStars,
  useStreak,
  useStudentLevel,
  XP_PER_ACTIVITY,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import {
  ACTIVITY_TYPE_LABELS,
  firstNameOf,
  GrowthAreaList,
  HolisticIndexCard,
  HonourBanner,
  relativeDayPhrase,
  ReportOverviewCard,
  SkillProfileCard,
  StarBoard,
  yearsTracked,
} from '@evolveiq/domain';
import {
  ChevronRight,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionTitle,
  Sparkles,
  Sprout,
  Sun,
  Target,
} from '@evolveiq/ui';
import { AssignmentChecklist, type ChecklistItem } from '../../components/AssignmentChecklist';
import { LevelProgress } from '../../components/LevelProgress';
import { SchoolNewsCard } from '../../components/SchoolNewsCard';
import { StarCount } from '../../components/StarCount';
import { StreakFlame } from '../../components/StreakFlame';

/**
 * The student's home: a personal growth companion. As in the client's
 * prototype it leads with progress and the graphs (client feedback, 28 Oct
 * 2026): how close the next level is, their score as rings and their
 * superpowers as a radar, then today's missions. A student sees only their
 * own work, and the stars they have been given for good things people noticed;
 * every request here is answered for them alone.
 */
export function TodayScreen() {
  const { user } = useAuth();
  const missions = useMyAssignments();
  const streak = useStreak(user?.id);
  const level = useStudentLevel();
  const growthAreas = useGrowthAreas(user?.id);
  const stars = useStars(user?.id);
  const holistic = useHolisticIndex(FEATURES.holisticIndex ? user?.id : undefined);
  const honours = useHonours();
  const notices = useNotices();

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
  const index = holistic.data;
  // Their own honour this month or last, while it is still news.
  const recentMonths = [businessMonth(), addMonths(businessMonth(), -1)];
  const myHonour = (honours.data ?? [])
    .filter((honour) => honour.honoree.id === user?.id && recentMonths.includes(honour.month))
    .sort((a, b) => b.month.localeCompare(a.month))[0];

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
        <div className="flex shrink-0 gap-2">
          {stars.data ? <StarCount count={stars.data.length} /> : null}
          {streak.data ? <StreakFlame days={streak.data.days} /> : null}
        </div>
      </header>

      {myHonour ? <HonourBanner honour={myHonour} audience="self" /> : null}

      {level.data ? <LevelProgress level={level.data} /> : null}

      {index && user ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <HolisticIndexCard studentName={user.fullName} index={index} />
          <SkillProfileCard
            title="My superpowers"
            icon={Sparkles}
            iconClassName="text-iris-500"
            hasAccentStrip
            skills={index.skills}
            action={
              <Link
                to="/student/report"
                className="inline-flex items-center gap-1 rounded-md text-[0.625rem] font-bold uppercase tracking-widest text-iris-600 hover:text-iris-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
              >
                Deep dive
                <ChevronRight className="size-3" />
              </Link>
            }
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
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

        <div className="flex flex-col gap-6 lg:col-span-5">
          {index ? (
            <ReportOverviewCard strengths={index.strengths} yearsTracked={yearsTracked(index)} to="/student/report" />
          ) : null}
          <StarBoard stars={stars.data ?? []} audience="student" isLoading={stars.isLoading} limit={2} />
          <SchoolNewsCard notices={notices.data ?? []} honours={honours.data ?? []} to="/student/notices" />

          <section>
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
    </div>
  );
}
