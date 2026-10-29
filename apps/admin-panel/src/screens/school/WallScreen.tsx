import { useState } from 'react';
import {
  businessMonth,
  useClassRoster,
  useCreateHonour,
  useDeleteHonour,
  useHonours,
  useStaffReviews,
  useUsers,
  type Honour,
  type NewHonour,
} from '@evolveiq/api-client';
import { formatMonth, HonourCard, HonourWall } from '@evolveiq/domain';
import { Button, Card, EmptyState, ErrorState, Medal, PageHeader, Plus, SectionTitle, Sparkles, Trophy } from '@evolveiq/ui';
import { saveErrorMessage } from '../../components/account-fields';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { HonourEditor, type HonourDraft } from '../../components/HonourEditor';

/**
 * The celebration wall, as the school admin keeps it (client feedback, 29 Oct
 * 2026): a Staff of the Month "promoted on the wall", and Students of the Month
 * to encourage children to do more. Staff see the whole wall in the school app;
 * a family sees the Staff of the Month and their own child's honours.
 */
export function WallScreen() {
  const month = businessMonth();
  const honours = useHonours();
  const teachers = useUsers({ role: 'teacher', isActive: true });
  const students = useUsers({ role: 'student', isActive: true });
  const roster = useClassRoster();
  const reviews = useStaffReviews({ month });
  const create = useCreateHonour();
  const remove = useDeleteHonour();

  const [draft, setDraft] = useState<HonourDraft | null>(null);
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<Honour | null>(null);
  const [removeError, setRemoveError] = useState<string>();

  if (honours.isError) return <ErrorState onRetry={() => void honours.refetch()} />;

  const all = honours.data ?? [];
  const thisMonth = all.filter((honour) => honour.month === month);
  const earlier = all.filter((honour) => honour.month !== month);
  const staffOfMonth = thisMonth.filter((honour) => honour.kind === 'staff_of_month');
  const studentsOfMonth = thisMonth.filter((honour) => honour.kind === 'student_of_month');
  const classNameById = new Map(roster.students.map((student) => [student.id, student.className]));
  const best = [...(reviews.data ?? [])].sort((a, b) => b.average - a.average)[0];

  const save = async (honour: NewHonour) => {
    setError(undefined);
    try {
      await create.mutateAsync(honour);
      setDraft(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not put that on the wall. Try again.'));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
      setRemoveError(undefined);
    } catch (caught) {
      setRemoveError(saveErrorMessage(caught, 'We could not take that down. Try again.'));
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Wall of fame"
        subtitle={`Celebrate the people who made ${formatMonth(month)}: a Staff of the Month, and Students of the Month.`}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setDraft({ kind: 'student_of_month', month })}>
            Name someone
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-4">
          <SectionTitle icon={Trophy} iconClassName="text-star-500">
            Staff of the Month
          </SectionTitle>
          {staffOfMonth.length > 0 ? (
            staffOfMonth.map((honour) => <HonourCard key={honour.id} honour={honour} onRemove={setRemoving} />)
          ) : (
            <Card className="flex flex-col items-start gap-3 p-6">
              <p className="text-sm font-medium text-ink-muted">Nobody is named for {formatMonth(month)} yet.</p>
              {best ? (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                  <Sparkles className="size-4 text-star-500" />
                  Best rated this month: {best.staff.fullName}, {best.average.toFixed(1)} of 5
                </p>
              ) : null}
              <Button
                size="sm"
                icon={Trophy}
                onClick={() => setDraft({ kind: 'staff_of_month', month, ...(best ? { honoreeId: best.staff.id } : {}) })}
              >
                Name Staff of the Month
              </Button>
            </Card>
          )}
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle icon={Medal} iconClassName="text-iris-500">
            Students of the Month
          </SectionTitle>
          {studentsOfMonth.map((honour) => (
            <HonourCard key={honour.id} honour={honour} onRemove={setRemoving} />
          ))}
          <Card className="flex flex-col items-start gap-3 p-6">
            <p className="text-sm font-medium text-ink-muted">
              {studentsOfMonth.length === 0
                ? `No students named for ${formatMonth(month)} yet. One a class works well.`
                : 'Name another, one for each class.'}
            </p>
            <Button size="sm" variant="secondary" icon={Medal} onClick={() => setDraft({ kind: 'student_of_month', month })}>
              Name a Student of the Month
            </Button>
          </Card>
        </section>
      </div>

      <section className="flex flex-col gap-4">
        <SectionTitle>Earlier months</SectionTitle>
        {earlier.length === 0 && !honours.isLoading ? (
          <EmptyState icon={Trophy} title="Nothing from earlier months" description="Each month’s honours stay on the wall here." />
        ) : (
          <HonourWall honours={earlier} isLoading={honours.isLoading} onRemove={setRemoving} />
        )}
      </section>

      <HonourEditor
        draft={draft}
        teachers={(teachers.data ?? []).map((teacher) => ({ id: teacher.id, fullName: teacher.fullName }))}
        students={(students.data ?? []).map((student) => {
          const className = classNameById.get(student.id);
          return { id: student.id, fullName: student.fullName, ...(className ? { detail: `Class ${className}` } : {}) };
        })}
        onClose={() => {
          setDraft(null);
          setError(undefined);
        }}
        onSave={save}
        isSaving={create.isPending}
        error={error}
      />
      <ConfirmDialog
        isOpen={removing !== null}
        title={removing ? `Take ${removing.honoree.fullName} off the wall?` : 'Take down'}
        description="The honour goes from every wall at once."
        confirmLabel="Take it down"
        onConfirm={() => void confirmRemove()}
        onClose={() => {
          setRemoving(null);
          setRemoveError(undefined);
        }}
        isWorking={remove.isPending}
        error={removeError}
      />
    </div>
  );
}
