import { Link } from 'react-router-dom';
import {
  useActivities,
  useActivityQueue,
  useHolisticIndex,
  useStreak,
  useStudentLevel,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import {
  firstNameOf,
  ReportOverviewCard,
  SkillProfileCard,
  yearsTracked,
} from '@evolveiq/domain';
import {
  ChevronRight,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionTitle,
  Sun,
  Target,
} from '@evolveiq/ui';
import {
  AssignmentChecklist,
  type AssignmentChecklistItem,
} from '../../components/AssignmentChecklist';
import { LevelProgress } from '../../components/LevelProgress';
import { StreakFlame } from '../../components/StreakFlame';

/**
 * The student's home: a personal growth companion. A student sees only their
 * own work and their own report; the api-client scopes every query to them.
 */
export function TodayScreen() {
  const { user } = useAuth();
  const studentId = user?.linkedStudentIds[0];

  const assignments = useActivityQueue(studentId ? { studentId } : {});
  const activities = useActivities();
  const streak = useStreak(studentId);
  const level = useStudentLevel(studentId);
  const holisticIndex = useHolisticIndex(studentId);

  if (assignments.isLoading || activities.isLoading) {
    return <LoadingState label="Getting your missions" />;
  }
  if (assignments.isError || activities.isError) {
    return <ErrorState onRetry={() => void assignments.refetch()} />;
  }

  const activityById = new Map((activities.data ?? []).map((activity) => [activity.id, activity]));
  const missions: AssignmentChecklistItem[] = (assignments.data ?? [])
    .flatMap((assignment) => {
      const activity = activityById.get(assignment.activityId);
      return activity ? [{ assignment, activity }] : [];
    })
    .sort(
      (a, b) =>
        Number(a.assignment.status === 'completed') - Number(b.assignment.status === 'completed'),
    );
  const index = holisticIndex.data;
  const firstName = user ? firstNameOf(user.name) : 'there';

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
        {streak.data ? <StreakFlame streak={streak.data} /> : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        {index ? (
          <ReportOverviewCard
            className="lg:col-span-7"
            strengths={index.strengths}
            yearsTracked={yearsTracked(index)}
            to="/student/report"
          />
        ) : null}

        {level.data ? (
          <div className="lg:col-span-7">
            <LevelProgress level={level.data} />
          </div>
        ) : null}

        {index ? (
          <SkillProfileCard
            className="lg:col-span-5 lg:col-start-8 lg:row-span-3 lg:row-start-1 lg:self-start"
            title="My superpowers"
            skills={index.skills}
            hasAccentStrip
            action={
              <Link
                to="/student/report"
                className="inline-flex items-center gap-0.5 rounded-md text-[0.625rem] font-bold uppercase tracking-widest text-iris-600 hover:text-iris-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
              >
                Deep dive
                <ChevronRight className="size-3" />
              </Link>
            }
          />
        ) : null}

        <section className="lg:col-span-7">
          <SectionTitle icon={Target} iconClassName="text-coral-500">
            Daily missions
          </SectionTitle>
          {missions.length === 0 ? (
            <EmptyState
              className="mt-4"
              icon={Sun}
              title="All done for now"
              description="When your teacher sets something new, it will show up here."
            />
          ) : (
            <AssignmentChecklist
              className="mt-4"
              variant="student"
              items={missions}
              linkFor={(assignment) => `/student/activities/${assignment.id}`}
            />
          )}
        </section>
      </div>
    </div>
  );
}
