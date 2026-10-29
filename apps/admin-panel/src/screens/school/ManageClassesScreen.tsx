import { useState } from 'react';
import {
  useClassRoster,
  useCreateClass,
  useDeleteClass,
  useRenameClass,
  useUpdateClassMembers,
  useUsers,
  type ClassDetail,
} from '@evolveiq/api-client';
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
  Trash2,
  UsersRound,
} from '@evolveiq/ui';
import { saveErrorMessage } from '../../components/account-fields';
import { ClassEditor, type ClassDraft } from '../../components/ClassEditor';
import { ConfirmDialog } from '../../components/ConfirmDialog';

const difference = (left: string[], right: string[]) => left.filter((id) => !right.includes(id));

/**
 * Class groups at the school: a name, any number of teachers, and students
 * (each in one class). Deleting a class leaves its students at the school,
 * waiting for another, with every record kept (client feedback, 29 Oct 2026).
 */
export function ManageClassesScreen() {
  const roster = useClassRoster();
  const teachers = useUsers({ role: 'teacher' });
  const students = useUsers({ role: 'student' });
  const createClass = useCreateClass();
  const renameClass = useRenameClass();
  const updateMembers = useUpdateClassMembers();
  const deleteClass = useDeleteClass();

  const [editing, setEditing] = useState<ClassDetail | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState<ClassDetail | null>(null);
  const [deleteError, setDeleteError] = useState<string>();

  if (roster.isError) return <ErrorState onRetry={roster.refetch} />;

  const groups = roster.classes;
  const studentsPlaced = groups.reduce((sum, detail) => sum + detail.students.length, 0);
  const averageSize = groups.length === 0 ? 0 : Math.round(studentsPlaced / groups.length);
  const withoutTeacher = groups.filter((detail) => detail.teachers.length === 0).length;
  const classNameByStudentId = new Map(roster.students.map((student) => [student.id, student.className]));

  const save = async (draft: ClassDraft) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        const created = await createClass.mutateAsync({ name: draft.name });
        await updateMembers.mutateAsync({
          classId: created.id,
          addTeacherIds: draft.teacherIds,
          addStudentIds: draft.studentIds,
          currentClassIdByStudentId: roster.classIdByStudentId,
        });
      } else if (editing) {
        if (draft.name !== editing.class.name) await renameClass.mutateAsync({ classId: editing.class.id, name: draft.name });
        const teacherIds = editing.teachers.map((teacher) => teacher.id);
        const studentIds = editing.students.map((student) => student.id);
        await updateMembers.mutateAsync({
          classId: editing.class.id,
          addTeacherIds: difference(draft.teacherIds, teacherIds),
          removeTeacherIds: difference(teacherIds, draft.teacherIds),
          addStudentIds: difference(draft.studentIds, studentIds),
          removeStudentIds: difference(studentIds, draft.studentIds),
          currentClassIdByStudentId: roster.classIdByStudentId,
        });
      }
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that class. Try again.'));
    }
  };

  const closeDelete = () => {
    setDeleting(null);
    setDeleteError(undefined);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteClass.mutateAsync(deleting.class.id);
      closeDelete();
    } catch (caught) {
      setDeleteError(saveErrorMessage(caught, `We could not delete ${deleting.class.name}. Try again.`));
    }
  };

  const columns: RecordsTableColumn<ClassDetail>[] = [
    {
      id: 'name',
      header: 'Class',
      sortValue: (detail) => detail.class.name,
      cell: (detail) => (
        <span className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-iris-50 text-iris-600">
            <LayoutGrid className="size-4" />
          </span>
          <span className="font-bold text-ink">{detail.class.name}</span>
        </span>
      ),
    },
    {
      id: 'teachers',
      header: 'Teachers',
      sortValue: (detail) => detail.teachers.map((teacher) => teacher.fullName).join(', '),
      cell: (detail) =>
        detail.teachers.length > 0 ? (
          detail.teachers.map((teacher) => teacher.fullName).join(', ')
        ) : (
          <span className="text-ink-faint">No teacher yet</span>
        ),
    },
    {
      id: 'students',
      header: 'Students',
      align: 'right',
      sortValue: (detail) => detail.students.length,
      cell: (detail) => <span className="tabular-nums">{detail.students.length}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Classes"
        subtitle="Class groups, their teachers and their students."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a class
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={LayoutGrid} label="Classes" value={groups.length} detail="At your school" />
        <StatTile icon={Backpack} tone="jade" label="Students placed" value={studentsPlaced} detail="Across every class" />
        <StatTile icon={UsersRound} tone="lilac" label="Typical class" value={averageSize} detail="Students per class, on average" />
        <StatTile
          icon={Presentation}
          tone="honey"
          label="Without a teacher"
          value={withoutTeacher}
          detail={withoutTeacher === 0 ? 'Every class has one' : 'Give these a teacher'}
        />
      </div>

      <RecordsTable
        caption="Classes at this school"
        rows={groups}
        columns={columns}
        getRowId={(detail) => detail.class.id}
        searchableText={(detail) => `${detail.class.name} ${detail.teachers.map((teacher) => teacher.fullName).join(' ')}`}
        searchPlaceholder="Search classes"
        isLoading={roster.isLoading}
        onRowClick={(detail) => setEditing(detail)}
        rowActions={(detail) => (
          <span className="inline-flex gap-1">
            <Button variant="quiet" size="sm" onClick={() => setEditing(detail)}>
              Edit
            </Button>
            <Button variant="danger-quiet" size="sm" icon={Trash2} aria-label={`Delete ${detail.class.name}`} onClick={() => setDeleting(detail)}>
              Delete
            </Button>
          </span>
        )}
        emptyTitle="No classes yet"
        emptyDescription="Add a class, then choose its teachers and students."
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a class
          </Button>
        }
      />

      <ClassEditor
        isOpen={editing !== null}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        {...(editing && editing !== 'new' ? { detail: editing } : {})}
        teachers={(teachers.data ?? []).filter((teacher) => teacher.isActive)}
        students={(students.data ?? []).filter((student) => student.isActive)}
        classNameByStudentId={classNameByStudentId}
        onSave={save}
        isSaving={createClass.isPending || renameClass.isPending || updateMembers.isPending}
        {...(error ? { error } : {})}
      />

      <ConfirmDialog
        isOpen={deleting !== null}
        title={deleting ? `Delete class ${deleting.class.name}?` : 'Delete class'}
        description={
          deleting
            ? `${deleting.teachers.length} ${deleting.teachers.length === 1 ? 'teacher is' : 'teachers are'} unassigned, and ${deleting.students.length} ${deleting.students.length === 1 ? 'student waits' : 'students wait'} for another class. Their accounts and records stay.`
            : ''
        }
        confirmLabel="Delete class"
        onConfirm={() => void confirmDelete()}
        onClose={closeDelete}
        isWorking={deleteClass.isPending}
        error={deleteError}
      />
    </div>
  );
}
