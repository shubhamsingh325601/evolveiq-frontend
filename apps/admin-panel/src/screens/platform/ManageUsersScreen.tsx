import { useState } from 'react';
import {
  useCreateUser,
  useDeleteUser,
  useSchools,
  useUpdateUser,
  useUsers,
} from '@evolveiq/api-client';
import type { Role, User } from '@evolveiq/api-client';
import { ROLE_LABELS } from '@evolveiq/auth';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { Avatar, Badge, Button, ErrorState, PageHeader, SegmentedControl } from '@evolveiq/ui';
import { RecordEditor, type RecordValues } from '../../components/RecordEditor';

const ALL_ROLES: Role[] = [
  'student',
  'parent',
  'teacher',
  'psychologist',
  'school-admin',
  'platform-admin',
];

/** Platform admins manage accounts across every role and every school. */
export function ManageUsersScreen() {
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const users = useUsers(roleFilter === 'all' ? {} : { role: roleFilter });
  const allUsers = useUsers();
  const schools = useSchools();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [error, setError] = useState<string>();

  if (users.isError) return <ErrorState onRetry={() => void users.refetch()} />;

  const schoolOptions = [
    { value: '', label: 'No school' },
    ...(schools.data ?? []).map((school) => ({ value: school.id, label: school.name })),
  ];
  const schoolNameById = new Map((schools.data ?? []).map((school) => [school.id, school.name]));

  const save = async (values: RecordValues) => {
    setError(undefined);
    try {
      const changes = {
        name: values.name ?? '',
        email: values.email ?? '',
        role: (values.role ?? 'teacher') as Role,
        schoolId: values.schoolId ? values.schoolId : null,
      };
      if (editing === 'new') {
        await createUser.mutateAsync(changes);
      } else if (editing) {
        await updateUser.mutateAsync({ userId: editing.id, changes });
      }
      setEditing(null);
    } catch {
      setError('We could not save that account. The email address may already be in use.');
    }
  };

  const columns: RecordsTableColumn<User>[] = [
    {
      id: 'name',
      header: 'Name',
      sortValue: (person) => person.name,
      cell: (person) => (
        <span className="flex items-center gap-3">
          <Avatar name={person.name} size="sm" />
          <span className="font-medium text-ink">{person.name}</span>
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email address',
      sortValue: (person) => person.email,
      cell: (person) => <span className="text-ink-muted">{person.email}</span>,
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
        person.schoolId ? (schoolNameById.get(person.schoolId) ?? 'Unknown') : 'Platform',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="People"
        subtitle="Every account across every school."
        actions={
          <Button size="sm" onClick={() => setEditing('new')}>
            Add an account
          </Button>
        }
      />

      <SegmentedControl
        label="Filter by role"
        value={roleFilter}
        onChange={setRoleFilter}
        options={[
          { value: 'all' as const, label: 'Everyone', count: (allUsers.data ?? []).length },
          ...ALL_ROLES.map((role) => ({
            value: role,
            label: ROLE_LABELS[role],
            count: (allUsers.data ?? []).filter((person) => person.role === role).length,
          })),
        ]}
      />

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <RecordsTable
        caption="All accounts"
        rows={users.data ?? []}
        columns={columns}
        getRowId={(person) => person.id}
        searchableText={(person) => `${person.name} ${person.email}`}
        searchPlaceholder="Search by name or email"
        isLoading={users.isLoading}
        onRowClick={(person) => setEditing(person)}
        rowActions={(person) => (
          <Button
            variant="quiet"
            size="sm"
            onClick={() => void deleteUser.mutateAsync(person.id)}
          >
            Remove
          </Button>
        )}
        emptyTitle="No accounts in this filter"
        emptyDescription="Switch roles, or add a new account."
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add an account' : 'Edit account'}
        saveLabel={editing === 'new' ? 'Create account' : 'Save changes'}
        isSaving={createUser.isPending || updateUser.isPending}
        fields={[
          { name: 'name', label: 'Full name', isRequired: true },
          { name: 'email', label: 'Email address', type: 'email', isRequired: true },
          {
            name: 'role',
            label: 'Role',
            type: 'select',
            options: ALL_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
          },
          { name: 'schoolId', label: 'School', type: 'select', options: schoolOptions },
        ]}
        {...(editing && editing !== 'new'
          ? {
              initialValues: {
                name: editing.name,
                email: editing.email,
                role: editing.role,
                schoolId: editing.schoolId ?? '',
              },
            }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
