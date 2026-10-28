import { Link, useParams } from 'react-router-dom';
import {
  businessDate,
  FEATURES,
  lastSevenDays,
  MAX_GROWTH_AREAS,
  useChildAssignments,
  useChildren,
  useFamilyObservations,
  useGrowthAreas,
  useGrowthMoments,
  useHolisticIndex,
  useMonthlySummary,
  useStars,
  useStreak,
} from '@evolveiq/api-client';
import {
  firstNameOf,
  formatMonth,
  GrowthAreaList,
  GrowthMoments,
  HolisticIndexCard,
  HolisticTrendCard,
  ObservationEntry,
  possessive,
  relativeDayPhrase,
  ReportOverviewCard,
  StarBoard,
  StarsOverTime,
  StreakIndicator,
  yearsTracked,
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
  Search,
  SectionTitle,
  Sprout,
  Star,
  StatTile,
} from '@evolveiq/ui';
import { AssignmentChecklist, type ChecklistItem } from '../../components/AssignmentChecklist';
import { ChildSwitcher } from '../../components/ChildSwitcher';
import { QuickLinkTile } from '../../components/QuickLinkTile';

/**
 * The parent's home for one child — the Child Understanding Center. It leads
 * with the graphs and the progress, the product's headline (client feedback,
 * 28 Oct 2026): the Holistic Index and how it has moved, the counts, the
 * Holistic Report Card and the stars month by month. Then this month in plain
 * words, the stars themselves, what the school has set, what is being worked
 * on, and what the parent has noticed.
 *
 * Nothing clinical can appear here: every response a parent receives is the
 * backend's parent shape, and the family hooks copy only its fields. A star
 * carries the giver's words about something good, and nothing else.
 */
export function ChildDashboardScreen() {
  const { childId } = useParams<{ childId: string }>();
  const children = useChildren();
  const assignments = useChildAssignments(childId);
  const streak = useStreak(childId);
  const growthAreas = useGrowthAreas(childId);
  const stars = useStars(childId);
  const holistic = useHolisticIndex(childId);
  const moments = useGrowthMoments(childId);
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
  const celebratePath = `${newObservationPath}&tone=positive`;
  const concernPath = `${newObservationPath}&tone=concern`;
  const summaryPath = `/parent/children/${child.id}/summary`;
  const childStars = stars.data ?? [];

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
  const index = FEATURES.holisticIndex ? holistic.data : undefined;

  return (
    <div className="flex flex-col gap-8">
      <ChildSwitcher students={children.data ?? [child]} currentChildId={child.id} />

      <header>
        <h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Parent Dashboard</h1>
        <p className="mt-2 text-sm font-medium text-ink-muted sm:text-base">
          Review {possessive(firstName)} progress and pending tasks.
        </p>
      </header>

      {index ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <HolisticIndexCard studentName={child.fullName} index={index} />
          <HolisticTrendCard studentName={child.fullName} index={index} />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <StatTile
          className="col-span-2 sm:col-span-1"
          icon={Star}
          tone="star"
          label="Stars"
          value={stars.data ? childStars.length : '–'}
          detail="For good things noticed"
        />
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

      <div className="grid gap-6 lg:grid-cols-2">
        {index ? (
          <ReportOverviewCard
            strengths={index.strengths}
            yearsTracked={yearsTracked(index)}
            to={`/parent/children/${child.id}/report`}
          />
        ) : null}
        <StarsOverTime stars={childStars} name={firstName} audience="family" />
      </div>

      {index ? (
        <div className="flex flex-wrap gap-3">
          <Link to={`/parent/children/${child.id}/wellbeing`} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
            Wellbeing check-in
            <ChevronRight />
          </Link>
          <Link to={`/parent/explore/${child.id}`} className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
            Explore ideas
            <ChevronRight />
          </Link>
          {(children.data ?? []).length > 1 ? (
            <Link to="/parent/siblings" className={buttonClasses({ size: 'sm', variant: 'secondary' })}>
              Compare strengths
              <ChevronRight />
            </Link>
          ) : null}
        </div>
      ) : null}

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
        <div className="flex flex-col gap-8">
          <StarBoard stars={childStars} name={firstName} audience="family" isLoading={stars.isLoading} />
          <GrowthMoments moments={moments.data ?? []} name={firstName} audience="family" isLoading={moments.isLoading} />

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
        </div>

        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <QuickLinkTile
              to={celebratePath}
              label="Celebrate something"
              icon={Star}
              iconClassName="border-star-200 bg-star-50 text-star-600 [&>svg]:fill-star-400"
            />
            <QuickLinkTile
              to={concernPath}
              label="Raise a concern"
              icon={Search}
              iconClassName="border-lilac-100 bg-lilac-50 text-lilac-600"
            />
            <QuickLinkTile
              to={summaryPath}
              label="Monthly summary"
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
                title="No growth areas yet"
                description="The school counsellor opens one only after reviewing a concern."
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
            description={`Celebrate something ${firstName} did, or note something to look into.`}
          />
        ) : (
          <Card isPlayful className="mt-3 p-6 sm:p-7">
            <RuledList>
              {entries.map((observation) => (
                <RuledListItem
                  key={observation.id}
                  tone={observation.tone === 'positive' ? 'star' : observation.status === 'pending' ? 'pending' : 'default'}
                >
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
