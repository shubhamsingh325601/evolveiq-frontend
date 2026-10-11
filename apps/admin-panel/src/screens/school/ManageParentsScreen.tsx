import { useParentLinks, useUsers, type User } from '@evolveiq/api-client';
import { HeartHandshake, StatTile, UsersRound } from '@evolveiq/ui';
import { ManagePeopleScreen } from '../../components/ManagePeopleScreen';

export function ManageParentsScreen() {
  const parents = useUsers({ role: 'parent' });
  const students = useUsers({ role: 'student' });
  const links = useParentLinks();

  const childrenByParent = new Map<string, string[]>();
  for (const link of links.data ?? []) {
    childrenByParent.set(link.parent.id, [...(childrenByParent.get(link.parent.id) ?? []), link.student.fullName]);
  }
  const families = parents.data ?? [];
  const enrolled = (students.data ?? []).filter((student) => student.isActive);
  const withoutParent = enrolled.filter((student) => !student.parentId).length;

  return (
    <ManagePeopleScreen
      role="parent"
      title="Parents"
      subtitle="Parent accounts and the children linked to them. A child has one parent account."
      addLabel="Add a parent"
      emptyTitle="No parent accounts yet"
      emptyDescription="Add a parent, then link them to their child from the Students screen."
      extraColumns={[
        {
          id: 'children',
          header: 'Children',
          sortValue: (parent: User) => (childrenByParent.get(parent.id) ?? []).length,
          cell: (parent: User) => {
            const names = childrenByParent.get(parent.id) ?? [];
            return names.length > 0 ? names.join(', ') : <span className="text-ink-faint">None linked</span>;
          },
        },
      ]}
      summary={
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <StatTile
            icon={HeartHandshake}
            label="Parent accounts"
            value={families.filter((parent) => parent.isActive).length}
            detail="Families using EvolvIQ"
          />
          <StatTile
            icon={UsersRound}
            tone="jade"
            label="Children linked"
            value={(links.data ?? []).length}
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
