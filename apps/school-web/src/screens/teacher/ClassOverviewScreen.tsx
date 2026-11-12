import { Link } from 'react-router-dom';
import {
  useClassRoster,
  useGrowthAreasForStudents,
  useStarsForStudents,
  useTeacherObservations,
  type RosterStudent,
} from '@evolveiq/api-client';
import { Avatar, Badge, Card, ChevronRight, EmptyState, ErrorState, Inbox, PageHeader, SectionTitle, Sprout, Star, StatTile, UsersRound } from '@evolveiq/ui';
import { GrowthAreaChips } from '../../components/GrowthAreaChips';

const ROW =
  'flex items-center gap-3 px-4 py-3 transition-colors hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-iris-500';

/**
 * Class overview: one panel per class the teacher teaches, with the numbers
 * that matter today and the students who need a look first.
 */
export function ClassOverviewScreen() {
  const roster = useClassRoster();
  const ownObservations = useTeacherObservations();
  const studentIds = roster.students.map((student) => student.id);
  const growthAreas = useGrowthAreasForStudents(studentIds);
  const stars = useStarsForStudents(studentIds);

  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  const pendingByStudent = new Map<string, number>();
  for (const observation of ownObservations.data ?? []) {
    if (observation.status !== 'pending') continue;
    pendingByStudent.set(observation.studentId, (pendingByStudent.get(observation.studentId) ?? 0) + 1);
  }
  const attentionOf = (student: RosterStudent) =>
    (pendingByStudent.get(student.id) ?? 0) + (growthAreas.get(student.id)?.length ?? 0);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader title="Class overview" subtitle="How each of your classes is doing, and who to look at first." />

      {!roster.isLoading && roster.classes.length === 0 ? (
        <EmptyState icon={UsersRound} title="No classes assigned to you yet" description="Your school admin adds you to classes." />
      ) : null}

      {roster.classes.map((detail) => {
        const members: RosterStudent[] = roster.students.filter((student) => student.classId === detail.class.id);
        const starCount = members.reduce((sum, student) => sum + (stars.get(student.id)?.length ?? 0), 0);
        const pending = members.reduce((sum, student) => sum + (pendingByStudent.get(student.id) ?? 0), 0);
        const areaCount = members.reduce((sum, student) => sum + (growthAreas.get(student.id)?.length ?? 0), 0);
        const needsAttention = members
          .filter((student) => attentionOf(student) > 0)
          .sort((a, b) => attentionOf(b) - attentionOf(a))
          .slice(0, 5);

        return (
          <section key={detail.class.id} aria-label={`Class ${detail.class.name}`} className="flex flex-col gap-4">
            <h2 className="text-2xl font-black tracking-tight text-ink">Class {detail.class.name}</h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
              <StatTile icon={UsersRound} label="Students" value={members.length} detail="In this class" />
              <StatTile icon={Star} tone="star" label="Stars" value={starCount} detail="Earned so far" />
              <StatTile icon={Inbox} tone="honey" label="Awaiting review" value={pending} detail="Your concerns with the counsellor" />
              <StatTile icon={Sprout} tone="jade" label="Growth areas open" value={areaCount} detail="Across the class" />
            </div>

            <SectionTitle>Look at first</SectionTitle>
            {needsAttention.length === 0 ? (
              <p className="text-sm font-medium text-ink-muted">Nobody needs attention right now.</p>
            ) : (
              <Card isPlayful className="overflow-hidden">
                <ul className="divide-y divide-line-soft">
                  {needsAttention.map((student) => {
                    const waiting = pendingByStudent.get(student.id) ?? 0;
                    return (
                      <li key={student.id}>
                        <Link to={`/teacher/students/${student.id}`} className={ROW}>
                          <Avatar name={student.fullName} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold text-ink">{student.fullName}</span>
                            <GrowthAreaChips growthAreas={growthAreas.get(student.id)} />
                          </span>
                          {waiting > 0 ? <Badge tone="pending">{waiting} awaiting review</Badge> : null}
                          <ChevronRight className="size-4 text-ink-faint" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            )}
          </section>
        );
      })}
    </div>
  );
}
