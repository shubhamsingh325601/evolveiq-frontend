import { useStudents, useUsers } from '@evolveiq/api-client';
import { HeartHandshake, StatTile, UsersRound } from '@evolveiq/ui';
import { ManagePeopleScreen } from '../../components/ManagePeopleScreen';

export function ManageParentsScreen() {
  const parents = useUsers({ role: 'parent' });
  const students = useStudents();

  const families = parents.data ?? [];
  const enrolled = students.data ?? [];
  const childrenLinked = new Set(families.flatMap((parent) => parent.linkedStudentIds)).size;
  const withoutParent = enrolled.filter((student) => student.parentIds.length === 0).length;

  return (
    <ManagePeopleScreen
      role="parent"
      title="Parents"
      subtitle="Parent accounts and the children linked to them."
      addLabel="Add a parent"
      emptyTitle="No parent accounts yet"
      emptyDescription="Add a parent, then link them to their child from the student record."
      summary={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile
            icon={HeartHandshake}
            label="Parent accounts"
            value={families.length}
            detail="Families using EvolvIQ"
          />
          <StatTile
            icon={UsersRound}
            tone="jade"
            label="Children linked"
            value={childrenLinked}
            detail="With a parent who can follow along"
          />
          <StatTile
            icon={UsersRound}
            tone="honey"
            label="Without a parent account"
            value={withoutParent}
            detail="Students no family can see yet"
          />
        </div>
      }
    />
  );
}
