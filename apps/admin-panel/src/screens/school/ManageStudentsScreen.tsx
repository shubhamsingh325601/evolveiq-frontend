import { useState } from 'react';
import {
  useClasses,
  useCreateStudent,
  useDeleteStudent,
  useStudents,
  useUpdateStudent,
} from '@evolveiq/api-client';
import type { Student } from '@evolveiq/api-client';
import { RecordsTable, ageFromDateOfBirth, type RecordsTableColumn } from '@evolveiq/domain';
import { Avatar, Button, ErrorState, PageHeader, Plus } from '@evolveiq/ui';
import { RecordEditor, type RecordValues } from '../../components/RecordEditor';

export function ManageStudentsScreen() {
  const students = useStudents();
  const classes = useClasses();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const deleteStudent = useDeleteStudent();

  const [editing, setEditing] = useState<Student | 'new' | null>(null);
  const [error, setError] = useState<string>();

  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const classOptions = (classes.data ?? []).map((group) => ({
    value: group.id,
    label: `${group.name}, ${group.yearLevel}`,
  }));
  const classNameById = new Map((classes.data ?? []).map((group) => [group.id, group.name]));

  const save = async (values: RecordValues) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        await createStudent.mutateAsync({
          name: values.name ?? '',
          dateOfBirth: values.dateOfBirth ?? '',
          classId: values.classId ?? '',
        });
      } else if (editing) {
        await updateStudent.mutateAsync({
          studentId: editing.id,
          changes: {
            name: values.name ?? '',
            dateOfBirth: values.dateOfBirth ?? '',
            classId: values.classId ?? '',
          },
        });
      }
      setEditing(null);
    } catch {
      setError('We could not save that student. Try again.');
    }
  };

  const remove = async (student: Student) => {
    setError(undefined);
    try {
      await deleteStudent.mutateAsync(student.id);
    } catch {
      setError('We could not remove that student.');
    }
  };

  const columns: RecordsTableColumn<Student>[] = [
    {
      id: 'name',
      header: 'Name',
      sortValue: (student) => student.name,
      cell: (student) => (
        <span className="flex items-center gap-3">
          <Avatar name={student.name} size="sm" />
          <span className="font-medium text-ink">{student.name}</span>
        </span>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      sortValue: (student) => classNameById.get(student.classId) ?? '',
      cell: (student) => classNameById.get(student.classId) ?? 'Unassigned',
    },
    {
      id: 'age',
      header: 'Age',
      isSecondary: true,
      sortValue: (student) => (student.dateOfBirth ? ageFromDateOfBirth(student.dateOfBirth) : 0),
      cell: (student) =>
        student.dateOfBirth ? `${ageFromDateOfBirth(student.dateOfBirth)}` : 'Not recorded',
    },
    {
      id: 'parents',
      header: 'Parents linked',
      isSecondary: true,
      align: 'right',
      sortValue: (student) => student.parentIds.length,
      cell: (student) => <span className="tabular-nums">{student.parentIds.length}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Students"
        subtitle="Everyone enrolled at your school."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a student
          </Button>
        }
      />

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <RecordsTable
        caption="Students at this school"
        rows={students.data ?? []}
        columns={columns}
        getRowId={(student) => student.id}
        searchableText={(student) => student.name}
        searchPlaceholder="Search students"
        isLoading={students.isLoading}
        onRowClick={(student) => setEditing(student)}
        rowActions={(student) => (
          <Button variant="danger-quiet" size="sm" onClick={() => void remove(student)}>
            Remove
          </Button>
        )}
        emptyTitle="No students yet"
        emptyDescription="Add the first student and they can be placed in a class."
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a student
          </Button>
        }
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a student' : 'Edit student'}
        saveLabel={editing === 'new' ? 'Add student' : 'Save changes'}
        isSaving={createStudent.isPending || updateStudent.isPending}
        fields={[
          { name: 'name', label: 'Full name', isRequired: true, placeholder: 'Maya Ahluwalia' },
          { name: 'dateOfBirth', label: 'Date of birth', type: 'date' },
          { name: 'classId', label: 'Class', type: 'select', options: classOptions },
        ]}
        {...(editing && editing !== 'new'
          ? {
              initialValues: {
                name: editing.name,
                dateOfBirth: editing.dateOfBirth,
                classId: editing.classId,
              },
            }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
