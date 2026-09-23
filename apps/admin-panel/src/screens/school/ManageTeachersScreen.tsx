import { ManagePeopleScreen } from '../../components/ManagePeopleScreen';

export function ManageTeachersScreen() {
  return (
    <ManagePeopleScreen
      role="teacher"
      title="Teachers"
      subtitle="Staff who can record observations and assign activities."
      addLabel="Add a teacher"
      emptyTitle="No teachers yet"
      emptyDescription="Add a teacher so they can be given a class."
    />
  );
}
