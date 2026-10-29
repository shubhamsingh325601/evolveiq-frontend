import { useEffect, useState } from 'react';
import { addMonths, businessMonth, type HonourKind, type NewHonour } from '@evolveiq/api-client';
import { formatMonth, HONOUR_KIND_LABELS } from '@evolveiq/domain';
import { Button, CircleAlert, FormField, Modal, SegmentedControl, Select, Textarea } from '@evolveiq/ui';

export interface HonourCandidate {
  id: string;
  fullName: string;
  /** A student's class, shown beside their name. */
  detail?: string;
}

export interface HonourDraft {
  kind: HonourKind;
  month: string;
  honoreeId?: string;
}

export interface HonourEditorProps {
  /** What to start from; null closes the dialog. */
  draft: HonourDraft | null;
  teachers: HonourCandidate[];
  students: HonourCandidate[];
  onClose: () => void;
  onSave: (honour: NewHonour) => Promise<unknown>;
  isSaving?: boolean;
  error?: string | undefined;
}

/**
 * Naming a Staff of the Month or a Student of the Month (client feedback, 29
 * Oct 2026): who, for which month, and why — the words that go on the wall.
 */
export function HonourEditor({ draft, teachers, students, onClose, onSave, isSaving = false, error }: HonourEditorProps) {
  const [kind, setKind] = useState<HonourKind>('staff_of_month');
  const [month, setMonth] = useState(businessMonth());
  const [honoreeId, setHonoreeId] = useState('');
  const [citation, setCitation] = useState('');
  const [problem, setProblem] = useState<string>();

  useEffect(() => {
    if (!draft) return;
    setKind(draft.kind);
    setMonth(draft.month);
    setHonoreeId(draft.honoreeId ?? '');
    setCitation('');
    setProblem(undefined);
  }, [draft]);

  const candidates = kind === 'staff_of_month' ? teachers : students;
  const months = [businessMonth(), addMonths(businessMonth(), -1)];

  const save = () => {
    if (!honoreeId) return setProblem(kind === 'staff_of_month' ? 'Choose a teacher.' : 'Choose a student.');
    if (!citation.trim()) return setProblem('Say why, in a sentence or two. It goes on the wall.');
    setProblem(undefined);
    void onSave({ kind, month, honoreeId, citation: citation.trim() });
  };

  return (
    <Modal
      isOpen={draft !== null}
      onClose={onClose}
      title={`Name a ${HONOUR_KIND_LABELS[kind]}`}
      description="It goes on the wall for the school. A student’s honour is seen by staff and by the student’s own family only."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={isSaving}>
            Put it on the wall
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <SegmentedControl
          label="Kind of honour"
          value={kind}
          onChange={(value) => {
            setKind(value);
            setHonoreeId('');
          }}
          options={[
            { value: 'staff_of_month', label: HONOUR_KIND_LABELS.staff_of_month },
            { value: 'student_of_month', label: HONOUR_KIND_LABELS.student_of_month },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={kind === 'staff_of_month' ? 'Teacher' : 'Student'}>
            <Select value={honoreeId} onChange={(event) => setHonoreeId(event.target.value)}>
              <option value="">Choose…</option>
              {candidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.detail ? `${candidate.fullName} · ${candidate.detail}` : candidate.fullName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="For">
            <Select value={month} onChange={(event) => setMonth(event.target.value)}>
              {months.map((value) => (
                <option key={value} value={value}>
                  {formatMonth(value)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
        <FormField label="Why" hint="In a sentence or two, as it should read on the wall.">
          <Textarea rows={3} maxLength={500} value={citation} onChange={(event) => setCitation(event.target.value)} />
        </FormField>
        {problem || error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {problem ?? error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
