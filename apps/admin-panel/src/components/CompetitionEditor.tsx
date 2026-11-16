import { useEffect, useState, type FormEvent } from 'react';
import type { Competition, CompetitionLevel, NewCompetition, School } from '@evolveiq/api-client';
import { COMPETITION_LEVEL_LABELS, COMPETITION_LEVELS } from '@evolveiq/domain';
import { Button, CircleAlert, FormField, Input, Modal, Select } from '@evolveiq/ui';

export interface CompetitionEditorProps {
  isOpen: boolean;
  /** The competition being changed; leave it out to enter a new one. */
  competition?: Competition | undefined;
  /** Platform admins choose a real school — unlike Notices, there is no "every school" option. */
  schools?: School[] | undefined;
  onClose: () => void;
  onSave: (competition: NewCompetition) => Promise<unknown>;
  isSaving?: boolean;
  error?: string | undefined;
}

const NO_SCHOOL = '';

/**
 * Entering a school into a competition, or changing one: a title, its level
 * (National, State, Inter-school or Intra-school) and, if dated, when it
 * happens. Status moves on from "Planning" from the list, not here. A
 * competition always belongs to exactly one school — a platform admin must
 * choose a real one, there is no "every school" option.
 */
export function CompetitionEditor({ isOpen, competition, schools, onClose, onSave, isSaving = false, error }: CompetitionEditorProps) {
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<CompetitionLevel>('intra_school');
  const [scheduledOn, setScheduledOn] = useState('');
  const [schoolId, setSchoolId] = useState(NO_SCHOOL);
  const [problems, setProblems] = useState<{ title?: string; schoolId?: string }>({});

  // Start from the competition opened, or from a blank one.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(competition?.title ?? '');
    setLevel(competition?.level ?? 'intra_school');
    setScheduledOn(competition?.scheduledOn ?? '');
    setSchoolId(competition?.schoolId ?? NO_SCHOOL);
    setProblems({});
  }, [isOpen, competition]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const found: typeof problems = {};
    if (title.trim() === '') found.title = 'Give it a title';
    if (schools && !competition && schoolId === NO_SCHOOL) found.schoolId = 'Choose which school this is for';
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    void onSave({
      title: title.trim(),
      level,
      ...(scheduledOn ? { scheduledOn } : {}),
      ...(schools && !competition ? { schoolId } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={competition ? 'Change the competition' : 'Enter a competition'}
      description="A title, its level, and when it happens."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit()} isLoading={isSaving}>
            {competition ? 'Save changes' : 'Enter it'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" aria-label={competition ? 'Change the competition' : 'Enter a competition'} noValidate>
        <FormField label="Title" {...(problems.title ? { error: problems.title } : {})}>
          <Input maxLength={120} value={title} placeholder="e.g. State Science Olympiad" onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Level">
            <Select value={level} onChange={(event) => setLevel(event.target.value as CompetitionLevel)}>
              {COMPETITION_LEVELS.map((value) => (
                <option key={value} value={value}>
                  {COMPETITION_LEVEL_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="When" isOptional>
            <Input type="date" value={scheduledOn} onChange={(event) => setScheduledOn(event.target.value)} />
          </FormField>
        </div>
        {schools ? (
          <FormField
            label="Which school"
            {...(competition ? { hint: 'A competition stays with the school it was entered for.' } : {})}
            {...(problems.schoolId ? { error: problems.schoolId } : {})}
          >
            <Select value={schoolId} disabled={Boolean(competition)} onChange={(event) => setSchoolId(event.target.value)}>
              <option value={NO_SCHOOL}>Choose a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </Select>
          </FormField>
        ) : null}
        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
