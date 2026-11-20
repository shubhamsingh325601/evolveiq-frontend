import { useState } from 'react';
import {
  businessDate,
  isApiError,
  useClassRoster,
  useCompetitions,
  useNominateStudent,
  useRemoveNomination,
  type Competition,
  type CompetitionStatus,
} from '@evolveiq/api-client';
import { useAuth } from '@evolveiq/auth';
import { COMPETITION_LEVEL_LABELS, COMPETITION_STATUS_LABELS, formatDayShort, RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { Badge, Button, CalendarDays, ErrorState, PageHeader, Select, StatTile, Trophy, UserCheck, UserX, type BadgeTone } from '@evolveiq/ui';
import { ClassFilter } from '../../components/ClassFilter';
import { useClassFilter } from '../../useClassChoice';

const LEVEL_TONE: Record<Competition['level'], BadgeTone> = {
  national: 'significant',
  state: 'reviewed',
  inter_school: 'growth',
  intra_school: 'neutral',
};

const STATUS_TONE: Record<CompetitionStatus, BadgeTone> = {
  planning: 'neutral',
  registration_open: 'pending',
  shortlisting: 'reviewed',
  confirmed: 'growth',
  finalized: 'star',
};

/**
 * Events & Competitions, as a teacher sees them — a gap found against the
 * client's UI prototype (16 Nov 2026), not yet a confirmed client request;
 * the project owner asked for it to be built anyway so it's ready to demo.
 * Teachers see their own school's competitions and nominate from their own
 * students (the same roster "My students" and assigning an activity use);
 * they see and remove their own nominations only — another teacher's stay
 * someone else's to remove. The Psychologist (the counsellor on screen) has
 * no school of their own, so the backend's rule leaves this view just for
 * teachers; there is no school-wide leaderboard, by backend design.
 */
export function CompetitionsScreen() {
  const { user } = useAuth();
  const competitions = useCompetitions();
  const roster = useClassRoster();
  const { classChoice, setClassChoice, students } = useClassFilter(roster);
  const nominate = useNominateStudent();
  const removeNomination = useRemoveNomination();

  const [studentChoice, setStudentChoice] = useState<Record<string, string>>({});
  const [rowError, setRowError] = useState<string>();

  if (competitions.isError) return <ErrorState onRetry={() => void competitions.refetch()} />;
  const list = competitions.data ?? [];
  const today = businessDate();
  const myNominationCount = list.reduce(
    (sum, competition) => sum + competition.nominations.filter((n) => n.nominatedBy.fullName === user?.fullName).length,
    0,
  );

  const availableStudents = (competition: Competition) => {
    const taken = new Set(competition.nominations.map((n) => n.studentId));
    return students.filter((student) => !taken.has(student.id));
  };
  // The student picked for a competition, while they are still on its list (the class drop-down can change it).
  const chosenFor = (competition: Competition) => {
    const options = availableStudents(competition);
    const picked = studentChoice[competition.id];
    return options.some((student) => student.id === picked) ? picked : options[0]?.id;
  };

  const doNominate = async (competition: Competition) => {
    const studentId = chosenFor(competition);
    if (!studentId) return;
    setRowError(undefined);
    try {
      await nominate.mutateAsync({ competitionId: competition.id, studentId });
      setStudentChoice((previous) => ({ ...previous, [competition.id]: '' }));
    } catch (caught) {
      setRowError(isApiError(caught) ? caught.message : `We could not nominate that student for “${competition.title}”. Try again.`);
    }
  };

  const doRemove = async (competition: Competition, studentId: string) => {
    setRowError(undefined);
    try {
      await removeNomination.mutateAsync({ competitionId: competition.id, studentId });
    } catch (caught) {
      setRowError(isApiError(caught) ? caught.message : 'We could not remove that nomination. Try again.');
    }
  };

  const columns: RecordsTableColumn<Competition>[] = [
    {
      id: 'title',
      header: 'Competition',
      sortValue: (competition) => competition.title,
      cell: (competition) => <span className="block min-w-0 font-bold text-ink">{competition.title}</span>,
    },
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
      id: 'status',
      header: 'Status',
      isSecondary: true,
      sortValue: (competition) => competition.status,
      cell: (competition) => <Badge tone={STATUS_TONE[competition.status]}>{COMPETITION_STATUS_LABELS[competition.status]}</Badge>,
    },
    {
      id: 'mine',
      header: 'Your nominations',
      cell: (competition) => {
        const mine = competition.nominations.filter((n) => n.nominatedBy.fullName === user?.fullName);
        if (mine.length === 0) return <span className="text-ink-faint">None yet</span>;
        return (
          <ul className="flex flex-wrap gap-1.5">
            {mine.map((nomination) => (
              <li key={nomination.studentId}>
                <Button
                  variant="quiet"
                  size="sm"
                  icon={UserX}
                  isLoading={removeNomination.isPending && removeNomination.variables?.studentId === nomination.studentId}
                  onClick={() => void doRemove(competition, nomination.studentId)}
                  aria-label={`Remove ${nomination.studentName} from “${competition.title}”`}
                >
                  {nomination.studentName}
                </Button>
              </li>
            ))}
          </ul>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Competitions" subtitle="National, state, inter-school and intra-house competitions at your school. Nominate from your own students." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Trophy} label="Open to you" value={list.length} detail="At your school" />
        <StatTile
          icon={CalendarDays}
          tone="jade"
          label="Coming up"
          value={list.filter((c) => c.scheduledOn !== null && c.scheduledOn >= today).length}
          detail="Dated, not yet run"
        />
        <StatTile icon={UserCheck} tone="lilac" label="Your nominations" value={myNominationCount} detail="Students you have entered" />
      </div>

      {rowError ? <ErrorState title="That did not work" description={rowError} /> : null}

      <ClassFilter classes={roster.classes} value={classChoice} onChange={setClassChoice} />

      <RecordsTable
        caption="Competitions at your school"
        rows={list}
        columns={columns}
        getRowId={(competition) => competition.id}
        searchableText={(competition) => `${competition.title} ${COMPETITION_LEVEL_LABELS[competition.level]}`}
        searchPlaceholder="Search by title"
        isLoading={competitions.isLoading || roster.isLoading}
        rowActions={(competition) => {
          const options = availableStudents(competition);
          if (options.length === 0) return <span className="text-xs text-ink-faint">No students left to nominate</span>;
          const chosen = chosenFor(competition);
          return (
            <span className="inline-flex items-center gap-2">
              <label className="sr-only" htmlFor={`${competition.id}-student`}>
                Student to nominate for “{competition.title}”
              </label>
              <Select
                id={`${competition.id}-student`}
                value={chosen}
                onChange={(event) => setStudentChoice((previous) => ({ ...previous, [competition.id]: event.target.value }))}
                className="h-9 w-40 py-0 text-xs"
              >
                {options.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                icon={UserCheck}
                isLoading={nominate.isPending && nominate.variables?.competitionId === competition.id}
                onClick={() => void doNominate(competition)}
              >
                Nominate
              </Button>
            </span>
          );
        }}
        emptyTitle="No competitions yet"
        emptyDescription="Your school admin will enter your school into one."
      />
    </div>
  );
}
