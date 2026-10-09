import { Outlet } from 'react-router-dom';
import {
  useActivities,
  useActivityQueue,
  useHolisticIndexes,
  useStudentLevel,
  useStudents,
  useTeacherNotesForStudents,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';
import { ChildrenSidebarCard } from './components/ChildrenSidebarCard';
import { LevelSidebarCard } from './components/LevelSidebarCard';
import { familyNotifications } from './family-notifications';

/** Wraps every signed-in route in the shared sidebar layout. */
export function AppFrame() {
  const { user, signOut } = useAuth();
  const students = useStudents();
  const isParent = user?.role === 'parent';
  const childIds = isParent ? (students.data ?? []).map((student) => student.id) : [];
  const indexes = useHolisticIndexes(childIds);
  const notes = useTeacherNotesForStudents(childIds);
  const assignments = useActivityQueue();
  const activities = useActivities();
  const level = useStudentLevel(user?.role === 'student' ? user.linkedStudentIds[0] : undefined);

  if (!user) return null;

  const contextCard = isParent ? (
    <ChildrenSidebarCard students={students.data ?? []} indexes={indexes.byStudentId} />
  ) : level.data ? (
    <LevelSidebarCard level={level.data} />
  ) : null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role)}
      userName={user.name}
      onSignOut={signOut}
      contextCard={contextCard}
      notificationsKey={user.id}
      notifications={familyNotifications({
        user,
        students: students.data ?? [],
        notes,
        assignments: assignments.data ?? [],
        activities: activities.data ?? [],
      })}
    >
      <Outlet />
    </AppLayout>
  );
}
