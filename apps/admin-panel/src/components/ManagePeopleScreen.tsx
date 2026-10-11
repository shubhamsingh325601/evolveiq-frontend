import { useState, type ReactNode } from 'react';
import {
  useCreateUser,
  useDeactivateUser,
  useReactivateUser,
  useUpdateUser,
  useUsers,
  type User,
  type UserChanges,
} from '@evolveiq/api-client';
import { ROLE_LABELS } from '@evolveiq/auth';
import { RecordsTable, type RecordsTableColumn } from '@evolveiq/domain';
import { Avatar, Button, ErrorState, PageHeader, Plus } from '@evolveiq/ui';
import { AccountStatusBadge } from './AccountStatusBadge';
import { EMAIL_FIELD, FULL_NAME_FIELD, PASSWORD_FIELD, saveErrorMessage } from './account-fields';
import { RecordEditor, type RecordValues } from './RecordEditor';

/**
 * Teachers and parents differ only in the role they are created with, so both
 * screens are this one component with a different role. Accounts are created
 * by the school admin (there is no sign-up), edited by name and email, and
 * switched off rather than deleted.
 */

export interface ManagePeopleScreenProps {
  role: 'teacher' | 'parent';
  title: string;
  subtitle: string;
  addLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  extraColumns?: RecordsTableColumn<User>[];
  /** The KPI row between the header and the table. */
  summary?: ReactNode;
}

export function ManagePeopleScreen({
  role,
  title,
  subtitle,
  addLabel,
  emptyTitle,
  emptyDescription,
  extraColumns = [],
  summary,
}: ManagePeopleScreenProps) {
  const people = useUsers({ role });
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();

  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [error, setError] = useState<string>();
  const [rowError, setRowError] = useState<string>();

  if (people.isError) return <ErrorState onRetry={() => void people.refetch()} />;

  const save = async (values: RecordValues) => {
    setError(undefined);
    try {
      if (editing === 'new') {
        await createUser.mutateAsync({
          role,
          fullName: (values.fullName ?? '').trim(),
          email: (values.email ?? '').trim(),
          password: values.password ?? '',
        });
      } else if (editing) {
        const changes: UserChanges = {};
        if (values.fullName?.trim() !== editing.fullName) changes.fullName = values.fullName?.trim();
        if (values.email?.trim().toLowerCase() !== editing.email) changes.email = values.email?.trim();
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
          <span className="font-bold text-ink">{person.fullName}</span>
        </span>
      ),
    },
    {
      id: 'email',
      header: 'Email address',
      isSecondary: true,
      sortValue: (person) => person.email ?? '',
      cell: (person) => <span className="text-ink-muted">{person.email}</span>,
    },
    ...extraColumns,
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
        title={title}
        subtitle={subtitle}
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            {addLabel}
          </Button>
        }
      />

      {summary}

      {rowError ? <ErrorState title="That did not save" description={rowError} /> : null}

      <RecordsTable
        caption={`${ROLE_LABELS[role]} accounts`}
        rows={people.data ?? []}
        columns={columns}
        getRowId={(person) => person.id}
        searchableText={(person) => `${person.fullName} ${person.email ?? ''}`}
        searchPlaceholder="Search by name or email"
        isLoading={people.isLoading}
        onRowClick={(person) => setEditing(person)}
        rowActions={(person) => (
          <Button
            variant={person.isActive ? 'danger-quiet' : 'quiet'}
            size="sm"
            onClick={() => void toggleActive(person)}
          >
            {person.isActive ? 'Switch off' : 'Switch on'}
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
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        title={editing === 'new' ? addLabel : 'Edit account'}
        {...(editing === 'new'
          ? { description: 'They sign in with this email address and password.' }
          : { description: 'Names and email addresses can change. The role and school never do.' })}
        saveLabel={editing === 'new' ? 'Create account' : 'Save changes'}
        isSaving={createUser.isPending || updateUser.isPending}
        fields={editing === 'new' ? [FULL_NAME_FIELD, EMAIL_FIELD, PASSWORD_FIELD] : [FULL_NAME_FIELD, EMAIL_FIELD]}
        {...(editing && editing !== 'new'
          ? { initialValues: { fullName: editing.fullName, email: editing.email ?? '' } }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
