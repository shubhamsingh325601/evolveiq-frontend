import { ManagePeopleScreen } from '../../components/ManagePeopleScreen';

export function ManageParentsScreen() {
  return (
    <ManagePeopleScreen
      role="parent"
      title="Parents"
      subtitle="Parent accounts and the children linked to them."
      addLabel="Add a parent"
      emptyTitle="No parent accounts yet"
      emptyDescription="Add a parent, then link them to their child from the student record."
    />
  );
}
