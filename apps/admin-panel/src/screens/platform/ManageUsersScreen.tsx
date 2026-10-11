import { useState } from 'react';
import {
  useCreateUser,
  useDeactivateUser,
  useReactivateUser,
  useSchools,
  useUpdateUser,
  useUserCounts,
  useUsers,
  type NewUser,
  type Role,
  type User,
  type UserChanges,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Avatar,
  Badge,
  Button,
  Contact,
  ErrorState,
  HeartHandshake,
  PageHeader,
  Plus,
  Presentation,
  School,
  SegmentedControl,
  StatTile,
} from '@evolveiq/ui';
import { AccountStatusBadge } from '../../components/AccountStatusBadge';
import {
  EMAIL_FIELD,
  FULL_NAME_FIELD,
  PASSWORD_FIELD,
  PIN_FIELD,
  saveErrorMessage,
  STUDENT_ID_FIELD,
} from '../../components/account-fields';
import { RecordEditor, type RecordEditorField, type RecordValues } from '../../components/RecordEditor';

const ALL_ROLES: Role[] = ['student', 'parent', 'teacher', 'school_admin', 'psychologist', 'platform_admin'];

/** Psychologists and platform admins work across schools; everyone else belongs to one. */
const isSchoolScoped = (role: Role) => role !== 'psychologist' && role !== 'platform_admin';

/** Platform admins manage accounts across every role and every school. */
export function ManageUsersScreen() {
  const { user: me } = useAuth();
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const users = useUsers(roleFilter === 'all' ? {} : { role: roleFilter });
  const schools = useSchools();
  const counts = useUserCounts({
    all: {},
    student: { role: 'student' },
    parent: { role: 'parent' },
    teacher: { role: 'teacher' },
    school_admin: { role: 'school_admin' },
    psychologist: { role: 'psychologist' },
    platform_admin: { role: 'platform_admin' },
  });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [rowError, setRowError] = useState<string>();

  if (users.isError) return <ErrorState onRetry={() => void users.refetch()} />;

  const schoolNameById = new Map((schools.data ?? []).map((school) => [school.id, school.name]));
  const schoolOptions = (schools.data ?? []).map((school) => ({ value: school.id, label: school.name }));
  const staffCount = (counts.teacher ?? 0) + (counts.school_admin ?? 0) + (counts.psychologist ?? 0);
  const familyCount = (counts.parent ?? 0) + (counts.student ?? 0);

  const newAccountFields = (values: RecordValues): RecordEditorField[] => {
    const role = (values.role as Role | undefined) ?? 'teacher';
    return [
      {
        name: 'role',
        label: 'Role',
        type: 'select',
        options: ALL_ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      },
      FULL_NAME_FIELD,
      ...(role === 'student' ? [STUDENT_ID_FIELD, PIN_FIELD] : [EMAIL_FIELD, PASSWORD_FIELD]),
      ...(isSchoolScoped(role)
        ? [
            {
              name: 'schoolId',
              label: 'School',
              type: 'select' as const,
              isRequired: true,
              options: [{ value: '', label: 'Choose a school' }, ...schoolOptions],
            },
          ]
        : []),
    ];
  };

  const editFields = (person: User): RecordEditorField[] => [
    FULL_NAME_FIELD,
    person.role === 'student' ? STUDENT_ID_FIELD : EMAIL_FIELD,
    {
      name: 'role',
      label: 'Role',
      isDisabled: true,
      hint: 'An account’s role and school never change. Create a new account instead.',
    },
    ...(person.schoolId ? [{ name: 'school', label: 'School', isDisabled: true }] : []),
  ];

  const save = async (values: RecordValues) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        const role = (values.role as Role | undefined) ?? 'teacher';
        const fullName = (values.fullName ?? '').trim();
        const schoolId = values.schoolId || undefined;
        const account: NewUser =
          role === 'student'
            ? { role, fullName, studentId: (values.studentId ?? '').trim(), pin: values.pin ?? '', ...(schoolId ? { schoolId } : {}) }
            : role === 'psychologist' || role === 'platform_admin'
              ? { role, fullName, email: (values.email ?? '').trim(), password: values.password ?? '' }
              : { role, fullName, email: (values.email ?? '').trim(), password: values.password ?? '', ...(schoolId ? { schoolId } : {}) };
        await createUser.mutateAsync(account);
      } else if (editing) {
        const changes: UserChanges = {};
        if (values.fullName?.trim() !== editing.fullName) changes.fullName = values.fullName?.trim();
        if (editing.role === 'student') {
          if (values.studentId?.trim().toUpperCase() !== editing.studentId) changes.studentId = values.studentId?.trim();
        } else if (values.email?.trim().toLowerCase() !== editing.email) {
          changes.email = values.email?.trim();
        }
        if (Object.keys(changes).length > 0) await updateUser.mutateAsync({ userId: editing.id, changes });
      }
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that account. Try again.'));
    }
  };

  const toggleActive = async (person: User) => {
    setRowError(undefined);
    try {
      if (person.isActive) await deactivateUser.mutateAsync(person.id);
      else await reactivateUser.mutateAsync(person.id);
    } catch (caught) {
      setRowError(saveErrorMessage(caught, `We could not change ${person.fullName}’s account. Try again.`));
    }
  };

  const columns: RecordsTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Name',
      sortValue: (person) => person.fullName,
      cell: (person) => (
        <span className="flex items-center gap-3">
          <Avatar name={person.fullName} size="sm" />
          <span className="min-w-0">
            <span className="block font-bold text-ink">{person.fullName}</span>
            <span className="block text-xs text-ink-muted">{person.email ?? `Student ID ${person.studentId}`}</span>
          </span>
        </span>
      ),
    },
    {
      id: 'role',
      header: 'Role',
      sortValue: (person) => ROLE_LABELS[person.role],
      cell: (person) => <Badge tone="neutral">{ROLE_LABELS[person.role]}</Badge>,
    },
    {
      id: 'school',
      header: 'School',
      isSecondary: true,
      sortValue: (person) => (person.schoolId ? (schoolNameById.get(person.schoolId) ?? '') : ''),
      cell: (person) =>
        person.schoolId ? (schoolNameById.get(person.schoolId) ?? 'Unknown') : <span className="text-ink-faint">Every school</span>,
    },
    {
      id: 'status',
      header: 'Account',
      align: 'right',
      sortValue: (person) => Number(person.isActive),
      cell: (person) => <AccountStatusBadge user={person} />,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="People"
        subtitle="Every account across every school."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add an account
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={Contact} label="Accounts" value={counts.all ?? '–'} detail="Across every role" />
        <StatTile icon={Presentation} tone="lilac" label="School staff" value={staffCount} detail="Teachers, psychologists and admins" />
        <StatTile icon={HeartHandshake} tone="jade" label="Families" value={familyCount} detail="Parents and students" />
        <StatTile icon={School} tone="honey" label="Schools" value={(schools.data ?? []).length} detail="Accounts belong to one" />
      </div>

      <SegmentedControl
        label="Filter by role"
        value={roleFilter}
        onChange={setRoleFilter}
        options={[
          { value: 'all' as const, label: 'Everyone', count: counts.all ?? 0 },
          ...ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role], count: counts[role] ?? 0 })),
        ]}
      />

      {rowError ? <ErrorState title="That did not save" description={rowError} /> : null}

      <RecordsTable
        caption="All accounts"
        rows={users.data ?? []}
        columns={columns}
        getRowId={(person) => person.id}
        searchableText={(person) => `${person.fullName} ${person.email ?? ''} ${person.studentId ?? ''}`}
        searchPlaceholder="Search by name, email or student ID"
        isLoading={users.isLoading}
        onRowClick={(person) => setEditing(person)}
        rowActions={(person) =>
          person.id === me?.id ? (
            <span className="text-xs text-ink-faint">You</span>
          ) : (
            <Button
              variant={person.isActive ? 'danger-quiet' : 'quiet'}
              size="sm"
              onClick={() => void toggleActive(person)}
            >
              {person.isActive ? 'Switch off' : 'Switch on'}
            </Button>
          )
        }
        emptyTitle="No accounts in this filter"
        emptyDescription="Switch roles, or add a new account."
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        title={editing === 'new' ? 'Add an account' : 'Edit account'}
        {...(editing === 'new'
          ? { description: 'Students sign in with a student ID and PIN; everyone else with an email and password.' }
          : {})}
        saveLabel={editing === 'new' ? 'Create account' : 'Save changes'}
        isSaving={createUser.isPending || updateUser.isPending}
        fields={editing === 'new' || editing === null ? newAccountFields : editFields(editing)}
        {...(editing === 'new' ? { initialValues: { role: 'teacher' } } : {})}
        {...(editing && editing !== 'new'
          ? {
              initialValues: {
                fullName: editing.fullName,
                email: editing.email ?? '',
                studentId: editing.studentId ?? '',
                role: ROLE_LABELS[editing.role],
                school: editing.schoolId ? (schoolNameById.get(editing.schoolId) ?? '') : '',
              },
            }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
