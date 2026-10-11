import { useEffect, useState } from 'react';
import type { ClassDetail, User } from '@evolveiq/api-client';
import { Button, Checkbox, CircleAlert, FormField, Input, Modal, Search } from '@evolveiq/ui';

export interface ClassDraft {
  name: string;
  teacherIds: string[];
  studentIds: string[];
}

export interface ClassEditorProps {
  isOpen: boolean;
  onClose: () => void;
  /** The class being edited; leave out to add one. */
  detail?: ClassDetail;
  teachers: User[];
  students: User[];
  /** Which class each placed student is in now, by name. */
  classNameByStudentId: Map<string, string>;
  onSave: (draft: ClassDraft) => Promise<unknown> | void;
  isSaving?: boolean;
  error?: string;
}

/**
 * A class's name, its teachers (a class can have several) and its students
 * (a student is in one class at a time, so ticking someone from another class
 * moves them here).
 */
export function ClassEditor({
  isOpen,
  onClose,
  detail,
  teachers,
  students,
  classNameByStudentId,
  onSave,
  isSaving = false,
  error,
}: ClassEditorProps) {
  const [name, setName] = useState('');
  const [teacherIds, setTeacherIds] = useState<string[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [nameProblem, setNameProblem] = useState<string>();

  useEffect(() => {
    if (!isOpen) return;
    setName(detail?.class.name ?? '');
    setTeacherIds(detail?.teachers.map((teacher) => teacher.id) ?? []);
    setStudentIds(detail?.students.map((student) => student.id) ?? []);
    setSearch('');
    setNameProblem(undefined);
    // Re-seed only when the dialog opens for a record.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);
  const needle = search.trim().toLowerCase();
  const shownStudents = students.filter((student) => !needle || student.fullName.toLowerCase().includes(needle));

  const submit = () => {
    if (!name.trim()) {
      setNameProblem('Class name is needed');
      return;
    }
    void onSave({ name: name.trim(), teacherIds, studentIds });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={detail ? `Edit class ${detail.class.name}` : 'Add a class'}
      description="Names are unique within your school, whatever the capitals."
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={isSaving}>
            {detail ? 'Save changes' : 'Add class'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <FormField label="Class name" {...(nameProblem ? { error: nameProblem } : {})}>
          <Input value={name} maxLength={100} placeholder="4B" onChange={(event) => setName(event.target.value)} />
        </FormField>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-ink">Teachers</legend>
          {teachers.length === 0 ? (
            <p className="text-sm text-ink-muted">Add teachers on the Teachers screen first.</p>
          ) : (
            teachers.map((teacher) => (
              <Checkbox
                key={teacher.id}
                variant="chip"
                label={teacher.fullName}
                checked={teacherIds.includes(teacher.id)}
                onChange={() => setTeacherIds((current) => toggle(current, teacher.id))}
              />
            ))
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-semibold text-ink">
            Students <span className="font-normal text-ink-muted">({studentIds.length} chosen)</span>
          </legend>
          <label className="sr-only" htmlFor="class-student-search">
            Find a student
          </label>
          <Input
            id="class-student-search"
            type="search"
            leadingIcon={Search}
            value={search}
            placeholder="Find a student"
            className="h-10 rounded-full"
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
            {shownStudents.map((student) => {
              const currentClass = classNameByStudentId.get(student.id);
              const isElsewhere = currentClass !== undefined && currentClass !== detail?.class.name;
              const isChosen = studentIds.includes(student.id);
              return (
                <Checkbox
                  key={student.id}
                  variant="chip"
                  label={
                    isElsewhere ? `${student.fullName} — in ${currentClass}${isChosen ? ', moves here' : ''}` : student.fullName
                  }
                  checked={isChosen}
                  onChange={() => setStudentIds((current) => toggle(current, student.id))}
                />
              );
            })}
            {shownStudents.length === 0 ? <p className="text-sm text-ink-muted">No students match.</p> : null}
          </div>
        </fieldset>

        {error ? (
          <p role="alert" className="flex items-start gap-2 rounded-xl bg-coral-50 px-3.5 py-3 text-sm text-coral-700">
            <CircleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
