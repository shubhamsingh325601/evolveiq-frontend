import { useState } from 'react';
import { isApiError, useCompleteTrainingEnrolment, useEnrolInTraining, useTrainings, type Training } from '@evolveiq/api-client';
import { formatDayShort, RecordsTable, TRAINING_REQUIREMENT_LABELS, type RecordsTableColumn } from '@evolveiq/domain';
import { Badge, Button, Check, ClipboardCheck, ErrorState, GraduationCap, Inbox, PageHeader, Siren, StatTile, type BadgeTone } from '@evolveiq/ui';

const REQUIREMENT_TONE: Record<Training['requirement'], BadgeTone> = {
  mandatory: 'significant',
  recommended: 'reviewed',
  optional: 'neutral',
};

/**
 * Staff training on offer — a gap found against the client's UI prototype
 * (16 Nov 2026), not yet a confirmed client request; the project owner asked
 * for it to be built anyway so it's ready to demo. Teachers see their
 * school's trainings and the ones for every school; the counsellor (a
 * psychologist on the backend, who works across every school) sees every
 * training. Enrol, then mark it complete when it's done — no school-wide
 * completion rate here, the backend has none to ask for.
 */
export function TrainingsScreen() {
  const trainings = useTrainings();
  const enrol = useEnrolInTraining();
  const complete = useCompleteTrainingEnrolment();
  const [rowError, setRowError] = useState<string>();

  if (trainings.isError) return <ErrorState onRetry={() => void trainings.refetch()} />;
  const list = trainings.data ?? [];
  const enrolled = list.filter((t) => t.myEnrolment !== null);
  const completed = enrolled.filter((t) => t.myEnrolment?.isComplete);

  const doEnrol = async (training: Training) => {
    setRowError(undefined);
    try {
      await enrol.mutateAsync(training.id);
    } catch (caught) {
      setRowError(isApiError(caught) ? caught.message : `We could not enrol you in “${training.title}”. Try again.`);
    }
  };

  const doComplete = async (training: Training) => {
    setRowError(undefined);
    try {
      await complete.mutateAsync(training.id);
    } catch (caught) {
      setRowError(isApiError(caught) ? caught.message : `We could not mark “${training.title}” complete. Try again.`);
    }
  };

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
      <PageHeader title="Trainings" subtitle="Staff training on offer. Enrol, then mark it complete once you've done it." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={GraduationCap} label="On offer" value={list.length} detail="Visible to you" />
        <StatTile icon={Siren} tone="coral" label="Mandatory" value={list.filter((t) => t.requirement === 'mandatory').length} detail="You should complete these" />
        <StatTile icon={Inbox} tone="honey" label="Enrolled" value={enrolled.length} detail="Not yet complete" />
        <StatTile icon={ClipboardCheck} tone="jade" label="Completed" value={completed.length} detail="Well done" />
      </div>

      {rowError ? <ErrorState title="That did not save" description={rowError} /> : null}

      <RecordsTable
        caption="Staff trainings"
        rows={list}
        columns={columns}
        getRowId={(training) => training.id}
        searchableText={(training) => `${training.title} ${training.description ?? ''}`}
        searchPlaceholder="Search by title"
        isLoading={trainings.isLoading}
        rowActions={(training) => {
          if (!training.myEnrolment) {
            return (
              <Button size="sm" isLoading={enrol.isPending && enrol.variables === training.id} onClick={() => void doEnrol(training)}>
                Enrol
              </Button>
            );
          }
          if (!training.myEnrolment.isComplete) {
            return (
              <Button
                size="sm"
                variant="secondary"
                icon={Check}
                isLoading={complete.isPending && complete.variables === training.id}
                onClick={() => void doComplete(training)}
              >
                Mark complete
              </Button>
            );
          }
          return <Badge tone="growth">Completed</Badge>;
        }}
        emptyTitle="No trainings yet"
        emptyDescription="Your school admin will offer trainings here."
      />
    </div>
  );
}
