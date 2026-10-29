import { useEffect, useState } from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import {
  useChildren,
  useChildrenAssignments,
  useHonours,
  useMyAssignments,
  useNotices,
  useStars,
  useStarsForStudents,
  useStudentLevel,
} from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout, schoolLifeNotifications, type AccountMenuSection } from '@evolveiq/domain';
import { Megaphone, ShieldCheck } from '@evolveiq/ui';
import { menuForRole } from './app-menu';
import { ChildrenSidebarCard } from './components/ChildrenSidebarCard';
import { LevelSidebarCard } from './components/LevelSidebarCard';
import { familyNotifications } from './family-notifications';
import type { FamilyFrameContext } from './useLastChildId';

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
  const notices = useNotices({}, { isEnabled: Boolean(user) });
  const honours = useHonours({}, { isEnabled: Boolean(user) });
  const childOnDashboard = useMatch('/parent/children/:childId/*')?.params.childId;
  const childOnExplore = useMatch('/parent/explore/:childId')?.params.childId;
  const childOnHealth = useMatch('/parent/health/:childId')?.params.childId;
  const openChildId = childOnDashboard ?? childOnExplore ?? childOnHealth;
  // Remembered across pages without a child in their path, so Explore and the guide start on them.
  const [lastChildId, setLastChildId] = useState<string>();
  useEffect(() => {
    if (openChildId) setLastChildId(openChildId);
  }, [openChildId]);

  if (!user) return null;

  const contextCard = isParent ? (
    <ChildrenSidebarCard students={childList} assignmentsByChild={assignmentsByChild} starsByChild={starsByChild} />
  ) : level.data ? (
    <LevelSidebarCard level={level.data} starCount={myStars.data?.length ?? 0} />
  ) : null;

  const noticesPath = isParent ? '/parent/notices' : '/student/notices';
  // Privacy left the parent's tab bar for Health (client feedback, 29 Oct 2026); it lives here now.
  const schoolSection: AccountMenuSection = {
    title: 'School',
    items: [
      { id: 'notices', label: 'Notice board', detail: 'Events, updates and emergency numbers', to: noticesPath, icon: Megaphone },
      ...(isParent
        ? [{ id: 'privacy', label: 'Privacy & safety', detail: 'What is kept, who sees it, your choices', to: '/parent/privacy', icon: ShieldCheck }]
        : []),
    ],
  };

  // A parent switches between their children, never between roles.
  const childSections: AccountMenuSection[] =
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
  const accountSections = [...childSections, schoolSection];

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
      notifications={[
        ...familyNotifications({
          user,
          missions: missions.data ?? [],
          myStars: myStars.data ?? [],
          children: childList,
          assignmentsByChild,
          starsByChild,
        }),
        ...schoolLifeNotifications({
          notices: notices.data ?? [],
          honours: honours.data ?? [],
          viewerId: user.id,
          noticesPath,
          honourPath: (honour) =>
            honour.kind === 'student_of_month' ? (isParent ? `/parent/children/${honour.honoree.id}` : '/student/today') : noticesPath,
        }),
      ]}
    >
      <Outlet context={{ lastChildId: openChildId ?? lastChildId } satisfies FamilyFrameContext} />
    </AppLayout>
  );
}
