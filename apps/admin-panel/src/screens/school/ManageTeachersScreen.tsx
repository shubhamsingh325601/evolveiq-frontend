import { useClasses, useUsers } from '@evolveiq/api-client';
import { Backpack, LayoutGrid, Presentation, StatTile } from '@evolveiq/ui';
import { ManagePeopleScreen } from '../../components/ManagePeopleScreen';

export function ManageTeachersScreen() {
  const teachers = useUsers({ role: 'teacher' });
  const classes = useClasses();

  const staff = teachers.data ?? [];
  const groups = classes.data ?? [];
  const staffIds = new Set(staff.map((teacher) => teacher.id));
  const coveredClasses = groups.filter((group) => staffIds.has(group.teacherId)).length;
  const studentsTaught = new Set(staff.flatMap((teacher) => teacher.linkedStudentIds)).size;

  return (
    <ManagePeopleScreen
      role="teacher"
      title="Teachers"
      subtitle="Staff who can record observations and assign activities."
      addLabel="Add a teacher"
      emptyTitle="No teachers yet"
      emptyDescription="Add a teacher so they can be given a class."
      summary={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile icon={Presentation} label="Teachers" value={staff.length} detail="With an account" />
          <StatTile
            icon={LayoutGrid}
            tone="lilac"
            label="Classes with a teacher"
            value={`${coveredClasses} of ${groups.length}`}
            detail="Every class needs one"
          />
          <StatTile
            icon={Backpack}
            tone="jade"
            label="Students taught"
            value={studentsTaught}
            detail="Linked to at least one teacher"
          />
        </div>
      }
    />
  );
}
