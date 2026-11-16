import { useState } from 'react';
import {
  businessDate,
  isApiError,
  useCreateCompetition,
  useCompetitions,
  useDeleteCompetition,
  useRemoveNomination,
  useSchools,
  useUpdateCompetition,
  type Competition,
  type CompetitionStatus,
  type NewCompetition,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { COMPETITION_LEVEL_LABELS, COMPETITION_STATUS_LABELS, COMPETITION_STATUSES, formatDayShort, RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { Badge, Button, CalendarCheck, CalendarDays, ErrorState, PageHeader, Pencil, Plus, Select, StatTile, Trash2, Trophy, UserCheck, Users, type BadgeTone } from '@evolveiq/ui';
import { saveErrorMessage } from '../components/account-fields';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CompetitionEditor } from '../components/CompetitionEditor';
import { CompetitionNominationsDialog } from '../components/CompetitionNominationsDialog';

const LEVEL_TONE: Record<Competition['level'], BadgeTone> = {
  national: 'significant',
  state: 'reviewed',
  inter_school: 'growth',
  intra_school: 'neutral',
};

/**
 * Events & Competitions, as its admins manage it — a gap found against the
 * client's UI prototype (16 Nov 2026), not yet a confirmed client request;
 * the project owner asked for it to be built anyway so it's ready to demo.
 * A school admin enters their school for one; a platform admin names a real
 * school, there is no "every school" option, unlike Notices. Teachers
 * nominate students from the school app; the per-competition nominee list is
 * all there is to see here — the backend has no school-wide leaderboard.
 */
export function CompetitionsScreen() {
  const { user } = useAuth();
  const isPlatform = user?.role === 'platform_admin';
  const competitions = useCompetitions();
  const schools = useSchools({ isEnabled: isPlatform });
  const create = useCreateCompetition();
  const update = useUpdateCompetition();
  const remove = useDeleteCompetition();
  const removeNomination = useRemoveNomination();

  const [editing, setEditing] = useState<Competition | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<Competition | null>(null);
  const [removeError, setRemoveError] = useState<string>();
  const [viewing, setViewing] = useState<Competition | null>(null);
  const [nominationsError, setNominationsError] = useState<string>();
  const [removingStudentId, setRemovingStudentId] = useState<string>();

  if (competitions.isError) return <ErrorState onRetry={() => void competitions.refetch()} />;
  const list = competitions.data ?? [];
  const today = businessDate();
  // The competition on screen in the dialog, kept in step with the list after a nomination changes.
  const viewed = viewing ? list.find((c) => c.id === viewing.id) ?? null : null;

  const save = async (fields: NewCompetition) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        await create.mutateAsync(fields);
      } else if (editing) {
        await update.mutateAsync({
          competitionId: editing.id,
          // The school a competition was entered for never changes.
          changes: { title: fields.title, level: fields.level, scheduledOn: fields.scheduledOn ?? null },
        });
      }
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that competition. Try again.'));
    }
  };

  const changeStatus = async (competition: Competition, status: CompetitionStatus) => {
    setError(undefined);
    try {
      await update.mutateAsync({ competitionId: competition.id, changes: { status } });
    } catch (caught) {
      setError(saveErrorMessage(caught, `We could not change “${competition.title}”. Try again.`));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
      setRemoveError(undefined);
    } catch (caught) {
      setRemoveError(saveErrorMessage(caught, 'We could not withdraw that competition. Try again.'));
    }
  };

  const removeStudent = async (studentId: string) => {
    if (!viewed) return;
    setNominationsError(undefined);
    setRemovingStudentId(studentId);
    try {
      await removeNomination.mutateAsync({ competitionId: viewed.id, studentId });
    } catch (caught) {
      setNominationsError(isApiError(caught) ? caught.message : 'We could not remove that nomination. Try again.');
    } finally {
      setRemovingStudentId(undefined);
    }
  };

  const enterButton = (
    <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
      Enter a competition
    </Button>
  );

  const totalNominations = list.reduce((sum, competition) => sum + competition.nominations.length, 0);

  const columns: RecordsTableColumn<Competition>[] = [
    {
      id: 'title',
      header: 'Competition',
      sortValue: (competition) => competition.title,
      cell: (competition) => <span className="block min-w-0 font-bold text-ink">{competition.title}</span>,
    },
    ...(isPlatform
      ? [
          {
            id: 'school',
            header: 'School',
            isSecondary: true,
            sortValue: (competition: Competition) => schools.data?.find((s) => s.id === competition.schoolId)?.name ?? '',
            cell: (competition: Competition) => schools.data?.find((s) => s.id === competition.schoolId)?.name ?? '—',
          } satisfies RecordsTableColumn<Competition>,
        ]
      : []),
    {
      id: 'level',
      header: 'Level',
      isSecondary: true,
      sortValue: (competition) => competition.level,
      cell: (competition) => <Badge tone={LEVEL_TONE[competition.level]}>{COMPETITION_LEVEL_LABELS[competition.level]}</Badge>,
    },
    {
      id: 'when',
      header: 'When',
      isSecondary: true,
      sortValue: (competition) => competition.scheduledOn ?? '',
      cell: (competition) => (competition.scheduledOn ? formatDayShort(competition.scheduledOn) : 'Not yet dated'),
    },
    {
      id: 'nominations',
      header: 'Nominations',
      align: 'right',
      sortValue: (competition) => competition.nominations.length,
      cell: (competition) => (
        <Button
          variant="quiet"
          size="sm"
          icon={UserCheck}
          onClick={() => setViewing(competition)}
          aria-label={`View nominations for “${competition.title}”, ${competition.nominations.length}`}
        >
          {competition.nominations.length}
        </Button>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      align: 'right',
      sortValue: (competition) => competition.status,
      cell: (competition) => (
        <span className="inline-block max-w-44">
          <label className="sr-only" htmlFor={`${competition.id}-status`}>
            Status of “{competition.title}”
          </label>
          <Select
            id={`${competition.id}-status`}
            value={competition.status}
            onChange={(event) => void changeStatus(competition, event.target.value as CompetitionStatus)}
            className="h-9 py-0 text-xs"
          >
            {COMPETITION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {COMPETITION_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </span>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Competitions"
        subtitle={
          isPlatform
            ? 'National, state, inter-school and intra-school competitions, one school each.'
            : 'National, state, inter-school and intra-school competitions for your school.'
        }
        actions={enterButton}
      />

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Trophy} label="Competitions" value={list.length} detail="Every one you can see" />
        <StatTile
          icon={CalendarDays}
          tone="jade"
          label="Coming up"
          value={list.filter((c) => c.scheduledOn !== null && c.scheduledOn >= today).length}
          detail="Dated, not yet run"
        />
        <StatTile
          icon={CalendarCheck}
          tone="honey"
          label="Registration open"
          value={list.filter((c) => c.status === 'registration_open').length}
          detail="Teachers can nominate"
        />
        <StatTile icon={Users} tone="lilac" label="Nominations" value={totalNominations} detail="Students entered so far" />
      </div>

      <RecordsTable
        caption="Competitions"
        rows={list}
        columns={columns}
        getRowId={(competition) => competition.id}
        searchableText={(competition) => `${competition.title} ${COMPETITION_LEVEL_LABELS[competition.level]}`}
        searchPlaceholder="Search by title"
        isLoading={competitions.isLoading}
        rowActions={(competition) => (
          <span className="inline-flex gap-1">
            <Button variant="quiet" size="sm" icon={Pencil} onClick={() => setEditing(competition)} aria-label={`Edit ${competition.title}`}>
              Edit
            </Button>
            <Button variant="danger-quiet" size="sm" icon={Trash2} onClick={() => setRemoving(competition)} aria-label={`Withdraw ${competition.title}`}>
              Withdraw
            </Button>
          </span>
        )}
        emptyTitle="No competitions yet"
        emptyDescription="Enter your school into one for teachers to nominate students."
      />

      <CompetitionEditor
        isOpen={editing !== null}
        competition={editing && editing !== 'new' ? editing : undefined}
        schools={isPlatform ? (schools.data ?? []) : undefined}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        onSave={save}
        isSaving={create.isPending || update.isPending}
        error={error}
      />

      <CompetitionNominationsDialog
        isOpen={viewing !== null}
        competition={viewed}
        onClose={() => {
          setViewing(null);
          setNominationsError(undefined);
        }}
        onRemove={(studentId) => void removeStudent(studentId)}
        isRemoving={(studentId) => removeNomination.isPending && removingStudentId === studentId}
        error={nominationsError}
      />

      <ConfirmDialog
        isOpen={removing !== null}
        title={removing ? `Withdraw “${removing.title}”?` : 'Withdraw competition'}
        description="Every nomination for it goes too."
        confirmLabel="Withdraw"
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
