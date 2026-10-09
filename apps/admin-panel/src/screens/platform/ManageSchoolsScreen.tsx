import { useState } from 'react';
import { useCreateSchool, useSchools, useUpdateSchool } from '@evolveiq/api-client';
import type { School } from '@evolveiq/api-client';
import { RecordsTable, formatDay, type RecordsTableColumn } from '@evolveiq/domain';
import {
  Backpack,
  Button,
  ErrorState,
  MapPin,
  PageHeader,
  Plus,
  Presentation,
  School as SchoolIcon,
  StatTile,
} from '@evolveiq/ui';
import { RecordEditor, type RecordValues } from '../../components/RecordEditor';

export function ManageSchoolsScreen() {
  const schools = useSchools();
  const createSchool = useCreateSchool();
  const updateSchool = useUpdateSchool();

  const [editing, setEditing] = useState<School | 'new' | null>(null);
  const [error, setError] = useState<string>();

  if (schools.isError) return <ErrorState onRetry={() => void schools.refetch()} />;

  const list = schools.data ?? [];
  const totalStudents = list.reduce((sum, school) => sum + school.studentCount, 0);
  const totalTeachers = list.reduce((sum, school) => sum + school.teacherCount, 0);
  const cities = new Set(list.map((school) => school.city).filter(Boolean)).size;

  const save = async (values: RecordValues) => {
    setError(undefined);
    const changes = { name: values.name ?? '', city: values.city ?? '' };
    try {
      if (editing === 'new') {
        await createSchool.mutateAsync(changes);
      } else if (editing) {
        await updateSchool.mutateAsync({ schoolId: editing.id, changes });
      }
      setEditing(null);
    } catch {
      setError('We could not save that school. Try again.');
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
      id: 'city',
      header: 'City',
      sortValue: (school) => school.city,
      cell: (school) => school.city || 'Not set',
    },
    {
      id: 'students',
      header: 'Students',
      align: 'right',
      sortValue: (school) => school.studentCount,
      cell: (school) => <span className="tabular-nums">{school.studentCount}</span>,
    },
    {
      id: 'teachers',
      header: 'Teachers',
      align: 'right',
      isSecondary: true,
      sortValue: (school) => school.teacherCount,
      cell: (school) => <span className="tabular-nums">{school.teacherCount}</span>,
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
          value={totalStudents.toLocaleString('en-GB')}
          detail="Enrolled across every school"
        />
        <StatTile
          icon={Presentation}
          tone="lilac"
          label="Teachers"
          value={totalTeachers.toLocaleString('en-GB')}
          detail="Across every school"
        />
        <StatTile icon={MapPin} tone="honey" label="Cities" value={cities} detail="Where our schools are" />
      </div>

      {error ? <ErrorState title="That did not save" description={error} /> : null}

      <RecordsTable
        caption="Schools on the platform"
        rows={schools.data ?? []}
        columns={columns}
        getRowId={(school) => school.id}
        searchableText={(school) => `${school.name} ${school.city}`}
        searchPlaceholder="Search schools"
        isLoading={schools.isLoading}
        onRowClick={(school) => setEditing(school)}
        emptyTitle="No schools yet"
        emptyDescription="Add the first school, then create its admin account."
        emptyAction={
          <Button size="sm" icon={Plus} onClick={() => setEditing('new')}>
            Add a school
          </Button>
        }
      />

      <RecordEditor
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a school' : 'Edit school'}
        saveLabel={editing === 'new' ? 'Add school' : 'Save changes'}
        isSaving={createSchool.isPending || updateSchool.isPending}
        fields={[
          {
            name: 'name',
            label: 'School name',
            isRequired: true,
            placeholder: 'Ridgeview Primary',
          },
          { name: 'city', label: 'City', placeholder: 'Pune' },
        ]}
        {...(editing && editing !== 'new'
          ? { initialValues: { name: editing.name, city: editing.city } }
          : {})}
        onSave={save}
        {...(error ? { error } : {})}
      />
    </div>
  );
}
