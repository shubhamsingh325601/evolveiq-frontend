import { Outlet } from 'react-router-dom';
import { useClasses, useSchools, useStudents, useUsers } from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';
import { OverviewSidebarCard } from './components/OverviewSidebarCard';

export function AppFrame() {
  const { user, signOut } = useAuth();
  const schools = useSchools();
  const students = useStudents();
  const classes = useClasses();
  const people = useUsers();

  if (!user) return null;

  const school = (schools.data ?? []).find((candidate) => candidate.id === user.schoolId);
  const accounts = people.data ?? [];

  const contextCard =
    user.role === 'school-admin' ? (
      <OverviewSidebarCard
        title="Your school"
        heading={school ? `${school.name}, ${school.city}` : 'Your school'}
        counts={[
          { label: 'Students', value: (students.data ?? []).length },
          { label: 'Teachers', value: accounts.filter((person) => person.role === 'teacher').length },
          { label: 'Classes', value: (classes.data ?? []).length },
        ]}
      />
    ) : user.role === 'platform-admin' ? (
      <OverviewSidebarCard
        title="The platform"
        heading="Every EvolvIQ school"
        counts={[
          { label: 'Schools', value: (schools.data ?? []).length },
          { label: 'Accounts', value: accounts.length },
          {
            // Enrolment as each school reports it, matching the Schools screen.
            label: 'Students',
            value: (schools.data ?? []).reduce((sum, entry) => sum + entry.studentCount, 0),
          },
        ]}
      />
    ) : null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role)}
      userName={user.name}
      onSignOut={signOut}
      contextLabel={user.role === 'platform-admin' ? 'All schools' : (school?.name ?? 'Your school')}
      contextCard={contextCard}
    >
      <Outlet />
    </AppLayout>
  );
}
