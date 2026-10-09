import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { BookOpen, ClipboardList, Inbox, Plus, UsersRound } from '@evolveiq/ui';

/** The school app's menu, by role. Consumed by the shared `AppSidebar` and `AppBottomNav`. */
export function menuForRole(role: Role, pendingReviewCount = 0): SidebarMenuSection[] {
  if (role === 'teacher') {
    return [
      {
        kind: 'action',
        items: [{ label: 'New observation', to: '/teacher/observations/new', icon: Plus }],
      },
      {
        title: 'Classroom',
        items: [
          { label: 'My students', shortLabel: 'Students', to: '/teacher/students', icon: UsersRound },
          {
            label: 'Assign an activity',
            shortLabel: 'Assign',
            to: '/teacher/assign',
            icon: ClipboardList,
          },
        ],
      },
    ];
  }

  if (role === 'psychologist') {
    return [
      {
        kind: 'action',
        items: [{ label: 'New activity', to: '/activities/new', icon: Plus }],
      },
      {
        title: 'Review',
        items: [
          {
            label: 'Review queue',
            shortLabel: 'Queue',
            to: '/review-queue',
            badge: pendingReviewCount,
            icon: Inbox,
          },
        ],
      },
      {
        title: 'Library',
        items: [
          {
            label: 'Activity library',
            shortLabel: 'Library',
            to: '/activities',
            isEndMatch: true,
            icon: BookOpen,
          },
        ],
      },
    ];
  }

  return [];
}
