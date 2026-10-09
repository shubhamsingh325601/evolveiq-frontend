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
import {
  Backpack,
  Button,
  ErrorState,
  LayoutGrid,
  PageHeader,
  Plus,
  Presentation,
  StatTile,
  UsersRound,
} from '@evolveiq/ui';
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

  const groups = classes.data ?? [];
  const studentsPlaced = groups.reduce((sum, group) => sum + group.studentIds.length, 0);
  const averageSize = groups.length === 0 ? 0 : Math.round(studentsPlaced / groups.length);
  const withoutTeacher = groups.filter((group) => !teacherNameById.has(group.teacherId)).length;

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
          <span className="font-bold text-ink">{group.name}</span>
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

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={LayoutGrid} label="Classes" value={groups.length} detail="At your school" />
        <StatTile
          icon={Backpack}
          tone="jade"
          label="Students placed"
          value={studentsPlaced}
          detail="Across every class"
        />
        <StatTile
          icon={UsersRound}
          tone="lilac"
          label="Typical class"
          value={averageSize}
          detail="Students per class, on average"
        />
        <StatTile
          icon={Presentation}
          tone="honey"
          label="Without a teacher"
          value={withoutTeacher}
          detail={withoutTeacher === 0 ? 'Every class has one' : 'Give these a class teacher'}
        />
      </div>

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
