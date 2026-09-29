import { useState } from 'react';
import {
  useClasses,
  useCreateClass,
  useDeleteClass,
  useUpdateClass,
  useUsers,
} from '@evolveiq/api-client';
import type { ClassGroup } from '@evolveiq/api-client';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { Button, ErrorState, LayoutGrid, PageHeader, Plus } from '@evolveiq/ui';
import { RecordEditor, type RecordValues } from '../../components/RecordEditor';

export function ManageClassesScreen() {
  const classes = useClasses();
  const teachers = useUsers({ role: 'teacher' });
  const createClass = useCreateClass();
  const updateClass = useUpdateClass();
  const deleteClass = useDeleteClass();

  const [editing, setEditing] = useState<ClassGroup | 'new' | null>(null);
  const [error, setError] = useState<string>();

  if (classes.isError) return <ErrorState onRetry={() => void classes.refetch()} />;

  const teacherOptions = (teachers.data ?? []).map((teacher) => ({
    value: teacher.id,
    label: teacher.name,
  }));
  const teacherNameById = new Map(
    (teachers.data ?? []).map((teacher) => [teacher.id, teacher.name]),
  );

  const save = async (values: RecordValues) => {
    setError(undefined);
    const changes = {
      name: values.name ?? '',
      yearLevel: values.yearLevel ?? '',
      teacherId: values.teacherId ?? '',
    };
    try {
      if (editing === 'new') {
        await createClass.mutateAsync(changes);
      } else if (editing) {
        await updateClass.mutateAsync({ classId: editing.id, changes });
      }
      setEditing(null);
    } catch {
      setError('We could not save that class. Try again.');
    }
  };

  const columns: RecordsTableColumn<ClassGroup>[] = [
    {
      id: 'name',
      header: 'Class',
      sortValue: (group) => group.name,
      cell: (group) => (
        <span className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-iris-50 text-iris-600">
            <LayoutGrid className="size-4" />
          </span>
          <span className="font-medium text-ink">{group.name}</span>
        </span>
      ),
    },
    {
      id: 'year',
      header: 'Year',
      sortValue: (group) => group.yearLevel,
      cell: (group) => group.yearLevel || 'Not set',
    },
    {
      id: 'teacher',
      header: 'Class teacher',
      sortValue: (group) => teacherNameById.get(group.teacherId) ?? '',
      cell: (group) => teacherNameById.get(group.teacherId) ?? 'Unassigned',
    },
    {
      id: 'students',
      header: 'Students',
      align: 'right',
      sortValue: (group) => group.studentIds.length,
      cell: (group) => <span className="tabular-nums">{group.studentIds.length}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Classes"
        subtitle="Class groups and the teacher responsible for each."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a class
          </Button>
        }
      />

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <RecordsTable
        caption="Classes at this school"
        rows={classes.data ?? []}
        columns={columns}
        getRowId={(group) => group.id}
        searchableText={(group) => `${group.name} ${group.yearLevel}`}
        searchPlaceholder="Search classes"
        isLoading={classes.isLoading}
        onRowClick={(group) => setEditing(group)}
        rowActions={(group) => (
          <Button
            variant="danger-quiet"
            size="sm"
            onClick={() => void deleteClass.mutateAsync(group.id)}
          >
            Remove
          </Button>
        )}
        emptyTitle="No classes yet"
        emptyDescription="Add a class, then place students in it."
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a class
          </Button>
        }
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a class' : 'Edit class'}
        saveLabel={editing === 'new' ? 'Add class' : 'Save changes'}
        isSaving={createClass.isPending || updateClass.isPending}
        fields={[
          { name: 'name', label: 'Class name', isRequired: true, placeholder: '4B' },
          { name: 'yearLevel', label: 'Year', placeholder: 'Year 4' },
          { name: 'teacherId', label: 'Class teacher', type: 'select', options: teacherOptions },
        ]}
        {...(editing && editing !== 'new'
          ? {
              initialValues: {
                name: editing.name,
                yearLevel: editing.yearLevel,
                teacherId: editing.teacherId,
              },
            }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
