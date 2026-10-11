import { Outlet } from 'react-router-dom';
import { useClasses, useSchool, useSchools, useUserCounts } from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';
import { OverviewSidebarCard } from './components/OverviewSidebarCard';

export function AppFrame() {
  const { user, signOut } = useAuth();
  const isSchoolAdmin = user?.role === 'school_admin';
  const isPlatformAdmin = user?.role === 'platform_admin';

  const school = useSchool(isSchoolAdmin ? user?.schoolId : undefined);
  const classes = useClasses({ isEnabled: isSchoolAdmin });
  const schools = useSchools({ isEnabled: isPlatformAdmin });
  // Counts come from the lists' own metadata: one tiny request each, no rows.
  const counts = useUserCounts(
    { students: { role: 'student', isActive: true }, teachers: { role: 'teacher', isActive: true }, everyone: {} },
    { isEnabled: Boolean(user) && (isSchoolAdmin || isPlatformAdmin) },
  );

  if (!user) return null;

  const contextCard = isSchoolAdmin ? (
    <OverviewSidebarCard
      title="Your school"
      heading={school.data?.name ?? 'Your school'}
      counts={[
        { label: 'Students', value: counts.students ?? 0 },
        { label: 'Teachers', value: counts.teachers ?? 0 },
        { label: 'Classes', value: (classes.data ?? []).length },
      ]}
    />
  ) : isPlatformAdmin ? (
    <OverviewSidebarCard
      title="The platform"
      heading="Every EvolvIQ school"
      counts={[
        { label: 'Schools', value: (schools.data ?? []).length },
        { label: 'Accounts', value: counts.everyone ?? 0 },
        { label: 'Students', value: counts.students ?? 0 },
      ]}
    />
  ) : null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role)}
      userName={user.fullName}
      onSignOut={signOut}
      contextLabel={isPlatformAdmin ? 'All schools' : (school.data?.name ?? 'Your school')}
      contextCard={contextCard}
    >
      <Outlet />
    </AppLayout>
  );
}
