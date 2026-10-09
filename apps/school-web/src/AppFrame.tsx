import { Outlet } from 'react-router-dom';
import {
  useActivities,
  useActivityQueue,
  useClasses,
  useObservations,
  useSchools,
  useStudents,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';
import { ClassesSidebarCard } from './components/ClassesSidebarCard';
import { ReviewPulseCard } from './components/ReviewPulseCard';
import { staffNotifications } from './staff-notifications';

export function AppFrame() {
  const { user, signOut } = useAuth();
  const observations = useObservations();
  const students = useStudents();
  const classes = useClasses();
  const schools = useSchools();
  const assignments = useActivityQueue();
  const activities = useActivities();

  if (!user) return null;

  const allObservations = observations.data ?? [];
  const pending = allObservations.filter((entry) => entry.status === 'pending');
  const schoolName = (schools.data ?? []).find((school) => school.id === user.schoolId)?.name;

  const contextCard =
    user.role === 'teacher' ? (
      <ClassesSidebarCard
        classes={(classes.data ?? []).filter((group) => group.teacherId === user.id)}
        students={students.data ?? []}
        pending={pending}
      />
    ) : user.role === 'psychologist' ? (
      <ReviewPulseCard observations={allObservations} />
    ) : null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role, pending.length)}
      userName={user.name}
      onSignOut={signOut}
      {...(schoolName ? { contextLabel: schoolName } : {})}
      contextCard={contextCard}
      notificationsKey={user.id}
      notifications={staffNotifications({
        user,
        observations: allObservations,
        students: students.data ?? [],
        assignments: assignments.data ?? [],
        activities: activities.data ?? [],
      })}
    >
      <Outlet />
    </AppLayout>
  );
}
