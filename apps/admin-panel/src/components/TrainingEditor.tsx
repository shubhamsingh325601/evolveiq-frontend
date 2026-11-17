import { useEffect, useState, type FormEvent } from 'react';
import type { NewTraining, School, Training, TrainingRequirement } from '@evolveiq/api-client';
import { TRAINING_REQUIREMENT_LABELS, TRAINING_REQUIREMENTS } from '@evolveiq/domain';
import { Button, CircleAlert, FormField, Input, Modal, Select, Textarea } from '@evolveiq/ui';

export interface TrainingEditorProps {
  isOpen: boolean;
  /** The training being changed; leave it out to offer a new one. */
  training?: Training | undefined;
  /** Platform admins choose a school, or every school. */
  schools?: School[] | undefined;
  onClose: () => void;
  onSave: (training: NewTraining) => Promise<unknown>;
  isSaving?: boolean;
  error?: string | undefined;
}

const EVERY_SCHOOL = '';

/**
 * Offering or changing a training: a title, what it covers, when it happens
 * (leave it out for self-paced or ongoing training), whether it is
 * mandatory, recommended or optional, and the credits it earns on
 * completion.
 */
export function TrainingEditor({ isOpen, training, schools, onClose, onSave, isSaving = false, error }: TrainingEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledOn, setScheduledOn] = useState('');
  const [requirement, setRequirement] = useState<TrainingRequirement>('mandatory');
  const [credits, setCredits] = useState('1');
  const [schoolId, setSchoolId] = useState(EVERY_SCHOOL);
  const [problems, setProblems] = useState<{ title?: string; credits?: string }>({});

  // Start from the training opened, or from a blank one.
  useEffect(() => {
    if (!isOpen) return;
    setTitle(training?.title ?? '');
    setDescription(training?.description ?? '');
    setScheduledOn(training?.scheduledOn ?? '');
    setRequirement(training?.requirement ?? 'mandatory');
    setCredits(String(training?.credits ?? 1));
    setSchoolId(training?.schoolId ?? EVERY_SCHOOL);
    setProblems({});
  }, [isOpen, training]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const found: typeof problems = {};
    if (title.trim() === '') found.title = 'Give it a title';
    const creditsNumber = Number(credits);
    if (credits.trim() === '' || !Number.isInteger(creditsNumber) || creditsNumber < 0 || creditsNumber > 20) {
      found.credits = 'A whole number from 0 to 20';
    }
    setProblems(found);
    if (Object.keys(found).length > 0) return;
    void onSave({
      title: title.trim(),
      requirement,
      credits: creditsNumber,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(scheduledOn ? { scheduledOn } : {}),
      ...(schools && !training && schoolId !== EVERY_SCHOOL ? { schoolId } : {}),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={training ? 'Change the training' : 'Offer a training'}
      description="What it covers, when it happens, and whether staff must take it."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => submit()} isLoading={isSaving}>
            {training ? 'Save changes' : 'Offer it'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-5" aria-label={training ? 'Change the training' : 'Offer a training'} noValidate>
        <FormField label="Title" {...(problems.title ? { error: problems.title } : {})}>
          <Input maxLength={120} value={title} placeholder="e.g. First aid and CPR training" onChange={(event) => setTitle(event.target.value)} />
        </FormField>
        <FormField label="What it covers" isOptional>
          <Textarea rows={4} maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="When" isOptional hint="Leave it out for self-paced or ongoing training.">
            <Input type="date" value={scheduledOn} onChange={(event) => setScheduledOn(event.target.value)} />
          </FormField>
          <FormField label="Credits" {...(problems.credits ? { error: problems.credits } : {})}>
            <Input type="number" inputMode="numeric" min={0} max={20} value={credits} onChange={(event) => setCredits(event.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Requirement">
            <Select value={requirement} onChange={(event) => setRequirement(event.target.value as TrainingRequirement)}>
              {TRAINING_REQUIREMENTS.map((value) => (
                <option key={value} value={value}>
                  {TRAINING_REQUIREMENT_LABELS[value]}
                </option>
              ))}
            </Select>
          </FormField>
          {schools ? (
            <FormField label="Which school" {...(training ? { hint: 'A training stays with the school it was offered for.' } : {})}>
              <Select value={schoolId} disabled={Boolean(training)} onChange={(event) => setSchoolId(event.target.value)}>
                <option value={EVERY_SCHOOL}>Every school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : null}
        </div>
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
