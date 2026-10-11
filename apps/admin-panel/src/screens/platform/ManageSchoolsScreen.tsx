import { useState } from 'react';
import {
  useCreateSchool,
  useRenameSchool,
  useSchools,
  useUserCounts,
  type School,
  type UserFilters,
} from '@evolveiq/api-client';
import { RecordsTable, formatDay, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Backpack,
  Button,
  Contact,
  ErrorState,
  PageHeader,
  Plus,
  Presentation,
  School as SchoolIcon,
  StatTile,
} from '@evolveiq/ui';
import { saveErrorMessage } from '../../components/account-fields';
import { RecordEditor, type RecordValues } from '../../components/RecordEditor';

/** Every school on EvolvIQ. A school is a name for now; its people are on the People screen. */
export function ManageSchoolsScreen() {
  const schools = useSchools();
  const createSchool = useCreateSchool();
  const renameSchool = useRenameSchool();
  const list = schools.data ?? [];

  // Enrolment per school, counted by the backend: one tiny request per figure.
  const perSchool = useUserCounts(
    Object.fromEntries(
      list.flatMap((school) => [
        [`students:${school.id}`, { schoolId: school.id, role: 'student', isActive: true }],
        [`teachers:${school.id}`, { schoolId: school.id, role: 'teacher', isActive: true }],
      ]),
    ) as Record<string, UserFilters>,
  );
  const totals = useUserCounts({
    students: { role: 'student', isActive: true },
    teachers: { role: 'teacher', isActive: true },
    everyone: {},
  });

  const [editing, setEditing] = useState<School | 'new' | null>(null);
  const [error, setError] = useState<string>();

  if (schools.isError) return <ErrorState onRetry={() => void schools.refetch()} />;

  const save = async (values: RecordValues) => {
    setError(undefined);
    const name = (values.name ?? '').trim();
    try {
      if (editing === 'new') await createSchool.mutateAsync({ name });
      else if (editing && name !== editing.name) await renameSchool.mutateAsync({ schoolId: editing.id, name });
      setEditing(null);
    } catch (caught) {
      setError(saveErrorMessage(caught, 'We could not save that school. Try again.'));
    }
  };

  const columns: RecordsTableColumn<School>[] = [
    {
      id: 'name',
      header: 'School',
      sortValue: (school) => school.name,
      cell: (school) => (
        <span className="flex items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-iris-50 text-iris-600">
            <SchoolIcon className="size-4" />
          </span>
          <span className="font-bold text-ink">{school.name}</span>
        </span>
      ),
    },
    {
      id: 'students',
      header: 'Students',
      align: 'right',
      sortValue: (school) => perSchool[`students:${school.id}`] ?? 0,
      cell: (school) => <span className="tabular-nums">{perSchool[`students:${school.id}`] ?? '–'}</span>,
    },
    {
      id: 'teachers',
      header: 'Teachers',
      align: 'right',
      isSecondary: true,
      sortValue: (school) => perSchool[`teachers:${school.id}`] ?? 0,
      cell: (school) => <span className="tabular-nums">{perSchool[`teachers:${school.id}`] ?? '–'}</span>,
    },
    {
      id: 'created',
      header: 'Added',
      align: 'right',
      isSecondary: true,
      sortValue: (school) => school.createdAt,
      cell: (school) => formatDay(school.createdAt),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Schools"
        subtitle="Every school using EvolvIQ."
        actions={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a school
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatTile icon={SchoolIcon} label="Schools" value={list.length} detail="Using EvolvIQ" />
        <StatTile
          icon={Backpack}
          tone="jade"
          label="Students"
          value={(totals.students ?? 0).toLocaleString('en-GB')}
          detail="Enrolled across every school"
        />
        <StatTile
          icon={Presentation}
          tone="lilac"
          label="Teachers"
          value={(totals.teachers ?? 0).toLocaleString('en-GB')}
          detail="Across every school"
        />
        <StatTile icon={Contact} tone="honey" label="Accounts" value={totals.everyone ?? 0} detail="Every role, every school" />
      </div>

      <RecordsTable
        caption="Schools on the platform"
        rows={list}
        columns={columns}
        getRowId={(school) => school.id}
        searchableText={(school) => school.name}
        searchPlaceholder="Search schools"
        isLoading={schools.isLoading}
        onRowClick={(school) => setEditing(school)}
        emptyTitle="No schools yet"
        emptyDescription="Add the first school, then create its admin on the People screen."
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a school
          </Button>
        }
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => {
          setEditing(null);
          setError(undefined);
        }}
        title={editing === 'new' ? 'Add a school' : 'Rename school'}
        saveLabel={editing === 'new' ? 'Add school' : 'Save changes'}
        isSaving={createSchool.isPending || renameSchool.isPending}
        fields={[{ name: 'name', label: 'School name', isRequired: true, maxLength: 200, placeholder: 'Ridgeview Primary' }]}
        {...(editing && editing !== 'new' ? { initialValues: { name: editing.name } } : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
