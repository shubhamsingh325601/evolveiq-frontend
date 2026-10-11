import { Outlet } from 'react-router-dom';
import {
  useChildren,
  useChildrenAssignments,
  useMyAssignments,
  useStudentLevel,
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
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  const children = useChildren({ isEnabled: isParent });
  const childList = children.data ?? [];
  const assignmentsByChild = useChildrenAssignments(childList.map((child) => child.id));
  const missions = useMyAssignments({ isEnabled: isStudent });
  const level = useStudentLevel({ isEnabled: isStudent });

  if (!user) return null;

  const contextCard = isParent ? (
    <ChildrenSidebarCard students={childList} assignmentsByChild={assignmentsByChild} />
  ) : level.data ? (
    <LevelSidebarCard level={level.data} />
  ) : null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role)}
      userName={user.fullName}
      onSignOut={signOut}
      contextCard={contextCard}
      notificationsKey={user.id}
      notifications={familyNotifications({
        user,
        missions: missions.data ?? [],
        children: childList,
        assignmentsByChild,
      })}
    >
      <Outlet />
    </AppLayout>
  );
}
