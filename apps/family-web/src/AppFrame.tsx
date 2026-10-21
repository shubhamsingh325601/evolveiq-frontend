import { Outlet, useMatch } from 'react-router-dom';
import {
  useChildren,
  useChildrenAssignments,
  useMyAssignments,
  useStars,
  useStarsForStudents,
  useStudentLevel,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout, type AccountMenuSection } from '@evolveiq/domain';
import { menuForRole } from './app-menu';
import { ChildrenSidebarCard } from './components/ChildrenSidebarCard';
import { LevelSidebarCard } from './components/LevelSidebarCard';
import { familyNotifications } from './family-notifications';

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Wraps every signed-in route in the shared sidebar layout. */
export function AppFrame() {
  const { user, signOut } = useAuth();
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';

  const children = useChildren({ isEnabled: isParent });
  const childList = children.data ?? [];
  const assignmentsByChild = useChildrenAssignments(childList.map((child) => child.id));
  const starsByChild = useStarsForStudents(childList.map((child) => child.id));
  const missions = useMyAssignments({ isEnabled: isStudent });
  const level = useStudentLevel({ isEnabled: isStudent });
  const myStars = useStars(user?.id, { isEnabled: isStudent });
  const openChildId = useMatch('/parent/children/:childId/*')?.params.childId;

  if (!user) return null;

  const contextCard = isParent ? (
    <ChildrenSidebarCard students={childList} assignmentsByChild={assignmentsByChild} starsByChild={starsByChild} />
  ) : level.data ? (
    <LevelSidebarCard level={level.data} starCount={myStars.data?.length ?? 0} />
  ) : null;

  // A parent switches between their children, never between roles.
  const accountSections: AccountMenuSection[] =
    isParent && childList.length > 0
      ? [
          {
            title: 'Your children',
            items: childList.map((child) => {
              const stars = starsByChild.get(child.id)?.length ?? 0;
              const toDo = (assignmentsByChild.get(child.id) ?? []).filter((assignment) => !assignment.isDone).length;
              return {
                id: child.id,
                label: child.fullName,
                detail: `${plural(stars, 'star', 'stars')} · ${toDo} to do`,
                to: `/parent/children/${child.id}`,
                isCurrent: child.id === openChildId,
              };
            }),
          },
        ]
      : [];

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role)}
      userName={user.fullName}
      onSignOut={signOut}
      contextCard={contextCard}
      accountSections={accountSections}
      notificationsKey={user.id}
      notifications={familyNotifications({
        user,
        missions: missions.data ?? [],
        myStars: myStars.data ?? [],
        children: childList,
        assignmentsByChild,
        starsByChild,
      })}
    >
      <Outlet />
    </AppLayout>
  );
}
