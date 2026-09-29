import { useState } from 'react';
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from '@evolveiq/api-client';
import type { Role, User } from '@evolveiq/api-client';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { ROLE_LABELS } from '@evolveiq/auth';
import { Avatar, Button, ErrorState, PageHeader, Plus } from '@evolveiq/ui';
import { RecordEditor, type RecordEditorField, type RecordValues } from './RecordEditor';

/**
 * Teachers and parents differ only in the role they are created with, so both
 * screens are this one component with a different role.
 */

export interface ManagePeopleScreenProps {
  role: Role;
  title: string;
  subtitle: string;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  /** Extra fields beyond name and email. */
  extraFields?: RecordEditorField[];
  extraColumns?: RecordsTableColumn<User>[];
}

export function ManagePeopleScreen({
  role,
  title,
  subtitle,
  addLabel,
  emptyTitle,
  emptyDescription,
  extraFields = [],
  extraColumns = [],
}: ManagePeopleScreenProps) {
  const people = useUsers({ role });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [error, setError] = useState<string>();

  if (people.isError) return <ErrorState onRetry={() => void people.refetch()} />;

  const save = async (values: RecordValues) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        await createUser.mutateAsync({
          name: values.name ?? '',
          email: values.email ?? '',
          role,
        });
      } else if (editing) {
        await updateUser.mutateAsync({
          userId: editing.id,
          changes: { name: values.name ?? '', email: values.email ?? '' },
        });
      }
      setEditing(null);
    } catch {
      setError('We could not save that. The email address may already be in use.');
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
    ...extraColumns,
    {
      id: 'students',
      header: 'Students linked',
      align: 'right',
      isSecondary: true,
      sortValue: (person) => person.linkedStudentIds.length,
      cell: (person) => <span className="tabular-nums">{person.linkedStudentIds.length}</span>,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            {addLabel}
          </Button>
        }
      />

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <RecordsTable
        caption={`${ROLE_LABELS[role]} accounts`}
        rows={people.data ?? []}
        columns={columns}
        getRowId={(person) => person.id}
        searchableText={(person) => `${person.name} ${person.email}`}
        searchPlaceholder="Search by name or email"
        isLoading={people.isLoading}
        onRowClick={(person) => setEditing(person)}
        rowActions={(person) => (
          <Button
            variant="danger-quiet"
            size="sm"
            onClick={() => void deleteUser.mutateAsync(person.id)}
          >
            Remove
          </Button>
        )}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            {addLabel}
          </Button>
        }
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? addLabel : 'Edit account'}
        saveLabel={editing === 'new' ? 'Create account' : 'Save changes'}
        isSaving={createUser.isPending || updateUser.isPending}
        fields={[
          { name: 'name', label: 'Full name', isRequired: true },
          { name: 'email', label: 'Email address', type: 'email', isRequired: true },
          ...extraFields,
        ]}
        {...(editing && editing !== 'new'
          ? { initialValues: { name: editing.name, email: editing.email } }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
