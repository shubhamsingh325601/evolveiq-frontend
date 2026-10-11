import { useClassRoster, useUsers, type User } from '@evolveiq/api-client';
import { Backpack, LayoutGrid, Presentation, StatTile } from '@evolveiq/ui';
import { ManagePeopleScreen } from '../../components/ManagePeopleScreen';

export function ManageTeachersScreen() {
  const teachers = useUsers({ role: 'teacher' });
  const roster = useClassRoster();

  const staff = teachers.data ?? [];
  const classNamesByTeacher = new Map<string, string[]>();
  for (const detail of roster.classes) {
    for (const teacher of detail.teachers) {
      classNamesByTeacher.set(teacher.id, [...(classNamesByTeacher.get(teacher.id) ?? []), detail.class.name]);
    }
  }
  const coveredClasses = roster.classes.filter((detail) => detail.teachers.length > 0).length;
  const studentsTaught = roster.classes
    .filter((detail) => detail.teachers.length > 0)
    .reduce((sum, detail) => sum + detail.students.length, 0);

  return (
    <ManagePeopleScreen
      role="teacher"
      title="Teachers"
      subtitle="Staff who record observations and assign activities to the students of their classes."
      addLabel="Add a teacher"
      emptyTitle="No teachers yet"
      emptyDescription="Add a teacher, then give them a class from the Classes screen."
      extraColumns={[
        {
          id: 'classes',
          header: 'Classes',
          sortValue: (teacher: User) => (classNamesByTeacher.get(teacher.id) ?? []).join(', '),
          cell: (teacher: User) => {
            const names = classNamesByTeacher.get(teacher.id) ?? [];
            return names.length > 0 ? names.join(', ') : <span className="text-ink-faint">None yet</span>;
          },
        },
      ]}
      summary={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile
            icon={Presentation}
            label="Teachers"
            value={staff.filter((teacher) => teacher.isActive).length}
            detail="With an active account"
          />
          <StatTile
            icon={LayoutGrid}
            tone="lilac"
            label="Classes with a teacher"
            value={`${coveredClasses} of ${roster.classes.length}`}
            detail="Every class needs one"
          />
          <StatTile icon={Backpack} tone="jade" label="Students taught" value={studentsTaught} detail="In a class with a teacher" />
        </div>
      }
    />
  );
}
