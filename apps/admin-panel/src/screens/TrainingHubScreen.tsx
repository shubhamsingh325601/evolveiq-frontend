import { useState } from 'react';
import { businessDate, useCreateTraining, useDeleteTraining, useSchools, useTrainings, useUpdateTraining, type NewTraining, type Training } from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { formatDayShort, RecordsTable, TRAINING_REQUIREMENT_LABELS, type RecordsTableColumn } from '@evolveiq/domain';
import { Badge, Button, CalendarDays, ErrorState, GraduationCap, Pencil, PageHeader, Plus, Trash2, Siren, StatTile, type BadgeTone } from '@evolveiq/ui';
import { saveErrorMessage } from '../components/account-fields';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { TrainingEditor } from '../components/TrainingEditor';

const REQUIREMENT_TONE: Record<Training['requirement'], BadgeTone> = {
  mandatory: 'significant',
  recommended: 'reviewed',
  optional: 'neutral',
};

/**
 * The Staff Training & Development Hub, as its admins manage it — a gap
 * found against the client's UI prototype (16 Nov 2026), not yet a confirmed
 * client request; the project owner asked for it to be built anyway so it's
 * ready to demo. A school admin offers trainings for their school; a
 * platform admin for one school or every school. Teachers and the
 * counsellor enrol and complete trainings from the school app; no
 * school-wide completion rate here — the backend has none to ask for.
 */
export function TrainingHubScreen() {
  const { user } = useAuth();
  const isPlatform = user?.role === 'platform_admin';
  const trainings = useTrainings();
  const schools = useSchools({ isEnabled: isPlatform });
  const create = useCreateTraining();
  const update = useUpdateTraining();
  const remove = useDeleteTraining();

  const [editing, setEditing] = useState<Training | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [removing, setRemoving] = useState<Training | null>(null);
  const [removeError, setRemoveError] = useState<string>();

  if (trainings.isError) return <ErrorState onRetry={() => void trainings.refetch()} />;
  const list = trainings.data ?? [];
  const today = businessDate();

  const save = async (fields: NewTraining) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        await create.mutateAsync(fields);
      } else if (editing) {
        await update.mutateAsync({
          trainingId: editing.id,
          // The school a training was offered for never changes.
          changes: {
            title: fields.title,
            requirement: fields.requirement,
            credits: fields.credits,
            description: fields.description ?? null,
            scheduledOn: fields.scheduledOn ?? null,
          },
        });
      }
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that training. Try again.'));
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    try {
      await remove.mutateAsync(removing.id);
      setRemoving(null);
      setRemoveError(undefined);
    } catch (caught) {
      setRemoveError(saveErrorMessage(caught, 'We could not delete that training. Try again.'));
    }
  };

  const offerButton = (
    <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
      Offer a training
    </Button>
  );

  const columns: RecordsTableColumn<Training>[] = [
    {
      id: 'title',
      header: 'Training',
      sortValue: (training) => training.title,
      cell: (training) => (
        <span className="block min-w-0">
          <span className="block font-bold text-ink">{training.title}</span>
          {training.description ? <span className="block truncate text-xs text-ink-muted">{training.description}</span> : null}
        </span>
      ),
    },
    ...(isPlatform
      ? [
          {
            id: 'school',
            header: 'School',
            isSecondary: true,
            sortValue: (training: Training) => training.schoolName ?? '',
            cell: (training: Training) => training.schoolName ?? 'Every school',
          } satisfies RecordsTableColumn<Training>,
        ]
      : []),
    {
      id: 'when',
      header: 'When',
      isSecondary: true,
      sortValue: (training) => training.scheduledOn ?? '',
      cell: (training) => (training.scheduledOn ? formatDayShort(training.scheduledOn) : 'Self-paced'),
    },
    {
      id: 'requirement',
      header: 'Requirement',
      isSecondary: true,
      sortValue: (training) => training.requirement,
      cell: (training) => <Badge tone={REQUIREMENT_TONE[training.requirement]}>{TRAINING_REQUIREMENT_LABELS[training.requirement]}</Badge>,
    },
    {
      id: 'credits',
      header: 'Credits',
      align: 'right',
      sortValue: (training) => training.credits,
      cell: (training) => <span className="font-bold tabular-nums text-ink">{training.credits}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Training hub"
        subtitle={
          isPlatform
            ? 'Staff training for one school or for every school, with its requirement and credits.'
            : 'Staff training for your school: when it happens, whether it is mandatory, and the credits it earns.'
        }
        actions={offerButton}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={GraduationCap} label="On offer" value={list.length} detail="Every training you can see" />
        <StatTile icon={Siren} tone="coral" label="Mandatory" value={list.filter((t) => t.requirement === 'mandatory').length} detail="Staff must complete these" />
        <StatTile
          icon={CalendarDays}
          tone="jade"
          label="Coming up"
          value={list.filter((t) => t.scheduledOn !== null && t.scheduledOn >= today).length}
          detail="Dated, not yet run"
        />
        <StatTile icon={GraduationCap} tone="lilac" label="Self-paced" value={list.filter((t) => t.scheduledOn === null).length} detail="No fixed date" />
      </div>

      <RecordsTable
        caption="Staff trainings"
        rows={list}
        columns={columns}
        getRowId={(training) => training.id}
        searchableText={(training) => `${training.title} ${training.description ?? ''} ${training.schoolName ?? ''}`}
        searchPlaceholder="Search by title"
        isLoading={trainings.isLoading}
        rowActions={(training) =>
          training.canManage ? (
            <span className="inline-flex gap-1">
              <Button variant="quiet" size="sm" icon={Pencil} onClick={() => setEditing(training)} aria-label={`Edit ${training.title}`}>
                Edit
              </Button>
              <Button variant="danger-quiet" size="sm" icon={Trash2} onClick={() => setRemoving(training)} aria-label={`Delete ${training.title}`}>
                Delete
              </Button>
            </span>
          ) : null
        }
        emptyTitle="No trainings yet"
        emptyDescription="Offer one for your staff to enrol in."
      />

      <TrainingEditor
        isOpen={editing !== null}
        training={editing && editing !== 'new' ? editing : undefined}
        schools={isPlatform ? (schools.data ?? []) : undefined}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        onSave={save}
        isSaving={create.isPending || update.isPending}
        error={error}
      />

      <ConfirmDialog
        isOpen={removing !== null}
        title={removing ? `Delete “${removing.title}”?` : 'Delete training'}
        description="Staff enrolled in it lose that record too."
        confirmLabel="Delete training"
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
