import { Link, useParams } from 'react-router-dom';
import {
  businessDate,
  lastSevenDays,
  MAX_GROWTH_AREAS,
  useChildAssignments,
  useChildren,
  useFamilyObservations,
  useGrowthAreas,
  useMonthlySummary,
  useStreak,
} from '@evolveiq/api-client';
import {
  firstNameOf,
  formatMonth,
  GrowthAreaList,
  ObservationEntry,
  possessive,
  relativeDayPhrase,
  StreakIndicator,
} from '@evolveiq/domain';
import {
  buttonClasses,
  CalendarDays,
  Card,
  Check,
  ChevronRight,
  ClipboardList,
  EmptyState,
  ErrorState,
  Flame,
  LoadingState,
  NotebookPen,
  Plus,
  Quote,
  RuledList,
  RuledListItem,
  SectionTitle,
  Sprout,
  StatTile,
} from '@evolveiq/ui';
import { AssignmentChecklist, type ChecklistItem } from '../../components/AssignmentChecklist';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { QuickLinkTile } from '../../components/QuickLinkTile';

/**
 * The parent's home for one child — the Child Understanding Center: this
 * month in plain words, what the school has set and what is done, what is
 * being worked on, and what the parent has noticed.
 *
 * Nothing clinical can appear here: every response a parent receives is the
 * backend's parent shape, and the family hooks copy only its fields.
 */
export function ChildDashboardScreen() {
  const { childId } = useParams<{ childId: string }>();
  const children = useChildren();
  const assignments = useChildAssignments(childId);
  const streak = useStreak(childId);
  const growthAreas = useGrowthAreas(childId);
  const observations = useFamilyObservations();
  const summary = useMonthlySummary(childId);

  if (children.isLoading) return <LoadingState label="Loading" />;
  const child = (children.data ?? []).find((candidate) => candidate.id === childId);
  if (children.isError || !child) {
    return (
      <ErrorState title="We could not open that child" description="Go back to your children and try again." />
    );
  }

  const firstName = firstNameOf(child.fullName);
  const newObservationPath = `/parent/observations/new?childId=${child.id}`;
  const summaryPath = `/parent/children/${child.id}/summary`;

  const all = assignments.data ?? [];
  const toDo = all.filter((assignment) => !assignment.isDone);
  const done = all.filter((assignment) => assignment.isDone);
  const tasks: ChecklistItem[] = [...toDo, ...done].map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    isDone: assignment.isDone,
    detail: assignment.completedAt
      ? `Finished ${relativeDayPhrase(assignment.completedAt)}`
      : `Set ${relativeDayPhrase(assignment.assignedAt)}`,
  }));
  const finishedDays = done.flatMap((assignment) => (assignment.completedAt ? [businessDate(assignment.completedAt)] : []));
  const entries = (observations.data ?? []).filter((observation) => observation.studentId === child.id);
  const openAreas = growthAreas.data ?? [];

  return (
    <div className="flex flex-col gap-8">
      <ChildSwitcher students={children.data ?? [child]} currentChildId={child.id} />

      <header>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Parent Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-ink-muted sm:text-base">
          Review {possessive(firstName)} progress and pending tasks.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={ClipboardList} label="To do" value={toDo.length} detail="Activities still open" />
        <StatTile icon={Check} tone="jade" label="Finished" value={done.length} detail="Activities done" />
        <StatTile
          icon={Flame}
          tone="honey"
          label="Streak"
          value={streak.data ? `${streak.data.days} ${streak.data.days === 1 ? 'day' : 'days'}` : '–'}
          detail="In a row with an activity done"
        />
        <StatTile
          icon={Sprout}
          tone="lilac"
          label="Growth areas"
          value={`${openAreas.length} of ${MAX_GROWTH_AREAS}`}
          detail="Being worked on at school"
        />
      </div>

      <Card isPlayful className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={CalendarDays} iconClassName="text-jade-500">
            {summary.data ? formatMonth(summary.data.month) : 'This month'}
          </SectionTitle>
          <Link to={summaryPath} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
            Earlier months
            <ChevronRight />
          </Link>
        </div>
        {summary.isLoading ? <LoadingState label="Writing this month’s summary" /> : null}
        {summary.data ? <Quote size="lg">{summary.data.text}</Quote> : null}
        {summary.isError ? (
          <p className="text-sm text-ink-muted">This month’s summary is not ready yet.</p>
        ) : null}
        {streak.data ? (
          <StreakIndicator days={streak.data.days} lastSevenDays={lastSevenDays(finishedDays, businessDate())} />
        ) : null}
      </Card>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
        <section>
          <SectionTitle>Pending actions and tasks</SectionTitle>
          {assignments.isLoading ? <LoadingState /> : null}
          {tasks.length === 0 && !assignments.isLoading ? (
            <EmptyState
              className="mt-3"
              icon={ClipboardList}
              title="Nothing set right now"
              description={`When ${possessive(firstName)} school sets an activity, it shows up here.`}
            />
          ) : (
            <AssignmentChecklist className="mt-3" variant="parent" items={tasks} />
          )}
        </section>

        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 gap-4">
            <QuickLinkTile
              to={summaryPath}
              label="Monthly summary"
              icon={CalendarDays}
              iconClassName="border-jade-100 bg-jade-50 text-jade-600"
            />
            <QuickLinkTile
              to={newObservationPath}
              label="Add an observation"
              icon={NotebookPen}
              iconClassName="border-lilac-100 bg-lilac-50 text-lilac-600"
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
                title="No growth areas yet"
                description="The school psychologist opens one after reviewing what has been noticed."
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
          What you have noticed
        </SectionTitle>
        {entries.length === 0 && !observations.isLoading ? (
          <EmptyState
            className="mt-3"
            icon={NotebookPen}
            title="Nothing recorded yet"
            description="Add the first observation and the school psychologist will read it."
          />
        ) : (
          <Card isPlayful className="mt-3 p-6 sm:p-7">
            <RuledList>
              {entries.map((observation) => (
                <RuledListItem key={observation.id} tone={observation.status === 'pending' ? 'pending' : 'default'}>
                  <ObservationEntry observation={observation} audience="family" authorName="You" />
                </RuledListItem>
              ))}
            </RuledList>
          </Card>
        )}
      </section>
    </div>
  );
}
