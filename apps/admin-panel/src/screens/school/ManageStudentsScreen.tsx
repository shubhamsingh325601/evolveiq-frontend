import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useClassesHealth,
  useClassRoster,
  useCreateUser,
  useDeactivateUser,
  useLinkParent,
  useReactivateUser,
  useSetStudentClass,
  useUnlinkParent,
  useUpdateUser,
  useUsers,
  type User,
  type UserChanges,
} from '@evolveiq/api-client';
import { CareFlags, RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Avatar,
  Backpack,
  Button,
  buttonClasses,
  ErrorState,
  HeartHandshake,
  HeartPulse,
  Inbox,
  LayoutGrid,
  PageHeader,
  Plus,
  StatTile,
  Trash2,
  Upload,
} from '@evolveiq/ui';
import { AccountStatusBadge } from '../../components/AccountStatusBadge';
import { FULL_NAME_FIELD, PIN_FIELD, saveErrorMessage, STUDENT_ID_FIELD } from '../../components/account-fields';
import { HealthDialog } from '../../components/HealthDialog';
import { RecordEditor, type RecordEditorField, type RecordValues } from '../../components/RecordEditor';
import { RemoveAccountDialog } from '../../components/RemoveAccountDialog';

/**
 * Everyone enrolled at the school. A student signs in with a student ID and a
 * six-digit PIN, is in one class at most, and has one parent account at most.
 * Students come one at a time or from a spreadsheet; an account is switched
 * off, or removed while it has no records; and the school office can record a
 * student's health and care needs (client feedback, 29 Oct 2026).
 */
export function ManageStudentsScreen() {
  const students = useUsers({ role: 'student' });
  const parents = useUsers({ role: 'parent' });
  const roster = useClassRoster();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const setStudentClass = useSetStudentClass();
  const linkParent = useLinkParent();
  const unlinkParent = useUnlinkParent();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [rowError, setRowError] = useState<string>();
  const [removing, setRemoving] = useState<User | null>(null);
  const [caringFor, setCaringFor] = useState<User | null>(null);
  const health = useClassesHealth(roster.classes.map((detail) => detail.class.id));

  if (students.isError) return <ErrorState onRetry={() => void students.refetch()} />;

  const classNameById = new Map(roster.classes.map((detail) => [detail.class.id, detail.class.name]));
  const parentNameById = new Map((parents.data ?? []).map((parent) => [parent.id, parent.fullName]));
  const enrolled = students.data ?? [];
  const active = enrolled.filter((student) => student.isActive);
  const withoutClass = active.filter((student) => !roster.classIdByStudentId.has(student.id)).length;
  const withParent = active.filter((student) => student.parentId).length;
  const needsCare = active.filter((student) => (health.byStudentId.get(student.id)?.conditions.length ?? 0) > 0).length;
  const isSaving =
    createUser.isPending || updateUser.isPending || setStudentClass.isPending || linkParent.isPending || unlinkParent.isPending;

  const classField: RecordEditorField = {
    name: 'classId',
    label: 'Class',
    type: 'select',
    hint: 'A student is in one class at a time.',
    options: [
      { value: '', label: 'Not in a class yet' },
      ...roster.classes.map((detail) => ({ value: detail.class.id, label: detail.class.name })),
    ],
  };
  const parentField: RecordEditorField = {
    name: 'parentId',
    label: 'Parent account',
    type: 'select',
    hint: 'One parent account per child. Add parents on the Parents screen.',
    options: [
      { value: '', label: 'No parent linked' },
      ...(parents.data ?? [])
        .filter((parent) => parent.isActive)
        .map((parent) => ({ value: parent.id, label: parent.fullName })),
    ],
  };

  const save = async (values: RecordValues) => {
    setError(undefined);
    const classId = values.classId || undefined;
    const parentId = values.parentId || undefined;
    try {
      if (editing === 'new') {
        const created = await createUser.mutateAsync({
          role: 'student',
          fullName: (values.fullName ?? '').trim(),
          studentId: (values.studentId ?? '').trim(),
          pin: values.pin ?? '',
          ...(parentId ? { parentId } : {}),
        });
        if (classId) await setStudentClass.mutateAsync({ studentId: created.id, toClassId: classId });
      } else if (editing) {
        const changes: UserChanges = {};
        if (values.fullName?.trim() !== editing.fullName) changes.fullName = values.fullName?.trim();
        if (values.studentId?.trim().toUpperCase() !== editing.studentId) changes.studentId = values.studentId?.trim();
        if (Object.keys(changes).length > 0) await updateUser.mutateAsync({ userId: editing.id, changes });

        const currentClassId = roster.classIdByStudentId.get(editing.id);
        if (currentClassId !== classId) {
          await setStudentClass.mutateAsync({
            studentId: editing.id,
            ...(currentClassId ? { fromClassId: currentClassId } : {}),
            ...(classId ? { toClassId: classId } : {}),
          });
        }
        const currentParentId = editing.parentId ?? undefined;
        if (currentParentId !== parentId) {
          if (currentParentId) await unlinkParent.mutateAsync(editing.id);
          if (parentId) await linkParent.mutateAsync({ parentId, studentId: editing.id });
        }
      }
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that student. Try again.'));
    }
  };

  const toggleActive = async (student: User) => {
    setRowError(undefined);
    try {
      if (student.isActive) await deactivateUser.mutateAsync(student.id);
      else await reactivateUser.mutateAsync(student.id);
    } catch (caught) {
      setRowError(saveErrorMessage(caught, `We could not change ${student.fullName}’s account. Try again.`));
    }
  };

  const columns: RecordsTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Name',
      sortValue: (student) => student.fullName,
      cell: (student) => (
        <span className="flex items-center gap-3">
          <Avatar name={student.fullName} size="sm" />
          <span className="min-w-0">
            <span className="block font-bold text-ink">{student.fullName}</span>
            <span className="block text-xs text-ink-muted">ID {student.studentId}</span>
          </span>
        </span>
      ),
    },
    {
      id: 'class',
      header: 'Class',
      sortValue: (student) => classNameById.get(roster.classIdByStudentId.get(student.id) ?? '') ?? '',
      cell: (student) =>
        classNameById.get(roster.classIdByStudentId.get(student.id) ?? '') ?? <span className="text-ink-faint">Not placed</span>,
    },
    {
      id: 'care',
      header: 'Care needs',
      isSecondary: true,
      sortValue: (student) => health.byStudentId.get(student.id)?.conditions.length ?? 0,
      // Profiles come by class; a student not in a class shows a dash rather than "none".
      cell: (student) =>
        roster.classIdByStudentId.has(student.id) ? (
          <CareFlags conditions={health.byStudentId.get(student.id)?.conditions} hasNotes={Boolean(health.byStudentId.get(student.id)?.careNotes)} />
        ) : (
          <span className="text-ink-faint">—</span>
        ),
    },
    {
      id: 'parent',
      header: 'Parent',
      isSecondary: true,
      sortValue: (student) => (student.parentId ? (parentNameById.get(student.parentId) ?? '') : ''),
      cell: (student) =>
        student.parentId ? (parentNameById.get(student.parentId) ?? 'Linked') : <span className="text-ink-faint">None linked</span>,
    },
    {
      id: 'status',
      header: 'Account',
      align: 'right',
      sortValue: (student) => Number(student.isActive),
      cell: (student) => <AccountStatusBadge user={student} />,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Students"
        subtitle="Everyone enrolled at your school."
        actions={
          <>
            <Link to="/school/import?role=student" className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
              <Upload />
              Import
            </Link>
            <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
              Add a student
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <StatTile className="col-span-2 sm:col-span-1" icon={Backpack} label="Students" value={active.length} detail="Enrolled at your school" />
        <StatTile
          icon={LayoutGrid}
          tone="lilac"
          label="Classes"
          value={roster.classes.length}
          detail="Groups students are placed in"
        />
        <StatTile
          icon={HeartHandshake}
          tone="jade"
          label="With a parent linked"
          value={`${withParent} of ${active.length}`}
          detail="Families following along"
        />
        <StatTile
          icon={Inbox}
          tone="honey"
          label="Without a class"
          value={withoutClass}
          detail={withoutClass === 0 ? 'Everyone is placed' : 'Waiting to be placed'}
        />
        <StatTile icon={HeartPulse} tone="coral" label="Special care" value={needsCare} detail="Health needs on record" />
      </div>

      {rowError ? <ErrorState title="That did not save" description={rowError} /> : null}

      <RecordsTable
        caption="Students at this school"
        rows={enrolled}
        columns={columns}
        getRowId={(student) => student.id}
        searchableText={(student) => `${student.fullName} ${student.studentId ?? ''}`}
        searchPlaceholder="Search by name or student ID"
        isLoading={students.isLoading}
        onRowClick={(student) => setEditing(student)}
        rowActions={(student) => (
          <span className="inline-flex flex-wrap justify-end gap-1">
            <Button variant="quiet" size="sm" icon={HeartPulse} aria-label={`Care needs for ${student.fullName}`} onClick={() => setCaringFor(student)}>
              Care needs
            </Button>
            <Button
              variant={student.isActive ? 'danger-quiet' : 'quiet'}
              size="sm"
              onClick={() => void toggleActive(student)}
            >
              {student.isActive ? 'Switch off' : 'Switch on'}
            </Button>
            <Button variant="danger-quiet" size="sm" icon={Trash2} aria-label={`Remove ${student.fullName}`} onClick={() => setRemoving(student)}>
              Remove
            </Button>
          </span>
        )}
        emptyTitle="No students yet"
        emptyDescription="Add the first student, then place them in a class."
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a student
          </Button>
        }
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        title={editing === 'new' ? 'Add a student' : 'Edit student'}
        {...(editing === 'new'
          ? { description: 'They sign in with their student ID and PIN.' }
          : { description: 'The PIN cannot be changed here yet.' })}
        saveLabel={editing === 'new' ? 'Add student' : 'Save changes'}
        isSaving={isSaving}
        fields={
          editing === 'new'
            ? [FULL_NAME_FIELD, STUDENT_ID_FIELD, PIN_FIELD, classField, parentField]
            : [FULL_NAME_FIELD, STUDENT_ID_FIELD, classField, parentField]
        }
        {...(editing && editing !== 'new'
          ? {
              initialValues: {
                fullName: editing.fullName,
                studentId: editing.studentId ?? '',
                classId: roster.classIdByStudentId.get(editing.id) ?? '',
                parentId: editing.parentId ?? '',
              },
            }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />

      <RemoveAccountDialog person={removing} onClose={() => setRemoving(null)} />
      <HealthDialog student={caringFor} onClose={() => setCaringFor(null)} />
    </div>
  );
}
