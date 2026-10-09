import { Link, useParams } from 'react-router-dom';
import {
  useActivities,
  useActivityQueue,
  useGrowthAreas,
  useHolisticIndex,
  useObservations,
  useStudent,
  useStudents,
} from '@evolveiq/api-client';
import {
  firstNameOf,
  GrowthAreaList,
  HolisticIndexCard,
  ObservationEntry,
  ReportOverviewCard,
  yearsTracked,
} from '@evolveiq/domain';
import {
  buttonClasses,
  CalendarDays,
  Card,
  ClipboardList,
  EmptyState,
  ErrorState,
  LoadingState,
  MessageCircle,
  NotebookPen,
  Plus,
  RuledList,
  RuledListItem,
  SectionTitle,
  Sprout,
  TrendingUp,
} from '@evolveiq/ui';
import { AssignmentChecklist, type AssignmentChecklistItem } from '../../components/AssignmentChecklist';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { QuickLinkTile } from '../../components/QuickLinkTile';

/**
 * The parent's home for one child — the Child Understanding Center. Leads
 * with the EvolvIQ Holistic Index and the way into the Holistic Report Card.
 *
 * Nothing clinical appears here: observations arrive already stripped of
 * level, learning-behaviour area and psychologist notes by
 * `packages/api-client`, and the EHI carries no clinical fields at all.
 */
export function ChildDashboardScreen() {
  const { childId } = useParams<{ childId: string }>();
  const students = useStudents();
  const student = useStudent(childId);
  const holisticIndex = useHolisticIndex(childId);
  const assignments = useActivityQueue(childId ? { studentId: childId } : {});
  const activities = useActivities();
  const growthAreas = useGrowthAreas(childId);
  const observations = useObservations(childId ? { studentId: childId } : {});

  if (student.isLoading) return <LoadingState label="Loading" />;
  if (student.isError || !student.data) {
    return (
      <ErrorState
        title="We could not open that child"
        description="Go back to your children and try again."
      />
    );
  }

  const child = student.data;
  const firstName = firstNameOf(child.name);
  const index = holisticIndex.data;
  const newObservationPath = `/parent/observations/new?childId=${child.id}`;

  const activityById = new Map((activities.data ?? []).map((activity) => [activity.id, activity]));
  const tasks: AssignmentChecklistItem[] = (assignments.data ?? [])
    .flatMap((assignment) => {
      const activity = activityById.get(assignment.activityId);
      return activity ? [{ assignment, activity }] : [];
    })
    // Still to do first, then what is finished.
    .sort(
      (a, b) =>
        Number(a.assignment.status === 'completed') - Number(b.assignment.status === 'completed'),
    );
  const entries = observations.data ?? [];
  const openAreas = growthAreas.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <ChildSwitcher students={students.data ?? [child]} currentChildId={child.id} />

      <header>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Parent Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-ink-muted sm:text-base">
          Review {firstName}’s progress and pending tasks.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {holisticIndex.isLoading ? (
          <LoadingState label="Working out the EvolvIQ Holistic Index" className="lg:col-span-2" />
        ) : index ? (
          <>
            <ReportOverviewCard
              strengths={index.strengths}
              yearsTracked={yearsTracked(index)}
              to={`/parent/children/${child.id}/report`}
            />
            <HolisticIndexCard studentName={child.name} index={index} />
          </>
        ) : (
          <EmptyState
            className="lg:col-span-2"
            icon={TrendingUp}
            title="No EvolvIQ Holistic Index yet"
            description={`${firstName}’s first EHI is worked out once a term of observations and activities is in.`}
          />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
        <section>
          <SectionTitle>Pending actions and tasks</SectionTitle>
          {tasks.length === 0 && !assignments.isLoading ? (
            <EmptyState
              className="mt-3"
              icon={ClipboardList}
              title="Nothing set right now"
              description={`When ${firstName}’s school sets an activity, it shows up here.`}
            />
          ) : (
            <AssignmentChecklist className="mt-3" variant="parent" items={tasks} />
          )}
        </section>

        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-4">
            <QuickLinkTile
              to={`/parent/children/${child.id}/notes`}
              label="Teacher notes"
              icon={MessageCircle}
              iconClassName="border-iris-100 bg-iris-50 text-iris-600"
            />
            <QuickLinkTile
              to={`/parent/children/${child.id}/summary`}
              label="This month"
              icon={CalendarDays}
              iconClassName="border-jade-100 bg-jade-50 text-jade-600"
            />
          </div>

          <section>
            <SectionTitle icon={Sprout} iconClassName="text-jade-500">
              What we are working on
            </SectionTitle>
            {openAreas.length === 0 && !growthAreas.isLoading ? (
              <EmptyState
                className="mt-3"
                icon={Sprout}
                title="No growth areas open"
                description="The school opens one when a pattern shows up across several observations."
              />
            ) : (
              <GrowthAreaList className="mt-3" growthAreas={openAreas} />
            )}
          </section>
        </div>
      </div>

      <section>
        <SectionTitle
          icon={NotebookPen}
          iconClassName="text-lilac-500"
          action={
            <Link to={newObservationPath} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
              <Plus />
              Add an observation
            </Link>
          }
        >
          What has been noticed
        </SectionTitle>
        {entries.length === 0 && !observations.isLoading ? (
          <EmptyState
            className="mt-3"
            icon={NotebookPen}
            title="Nothing recorded yet"
            description="Add the first observation and the school will see it."
          />
        ) : (
          <Card isPlayful className="mt-3 p-6 sm:p-7">
            <RuledList>
              {entries.map((observation) => (
                <RuledListItem
                  key={observation.id}
                  tone={observation.status === 'pending' ? 'pending' : 'default'}
                >
                  <ObservationEntry observation={observation} />
                </RuledListItem>
              ))}
            </RuledList>
          </Card>
        )}
      </section>
    </div>
  );
}
