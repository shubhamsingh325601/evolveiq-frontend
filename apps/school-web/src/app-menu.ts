import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { Backpack, BookOpen, ClipboardList, Inbox, Plus } from '@evolveiq/ui';

/** The school app's menu, by role. Consumed by the shared `AppSidebar` and `AppBottomNav`. */
export function menuForRole(role: Role, pendingReviewCount = 0): SidebarMenuSection[] {
  if (role === 'teacher') {
    return [
      {
        items: [
          { label: 'My students', shortLabel: 'Students', to: '/teacher/students', icon: Backpack },
          {
            label: 'Assign an activity',
            shortLabel: 'Assign',
            to: '/teacher/assign',
            icon: ClipboardList,
          },
        ],
      },
      {
        kind: 'action',
        items: [{ label: 'New observation', to: '/teacher/observations/new', icon: Plus }],
      },
    ];
  }

  if (role === 'psychologist') {
    return [
      {
        items: [
          {
            label: 'Review queue',
            shortLabel: 'Queue',
            to: '/review-queue',
            badge: pendingReviewCount,
            icon: Inbox,
          },
          {
            label: 'Activity library',
            shortLabel: 'Library',
            to: '/activities',
            isEndMatch: true,
            icon: BookOpen,
          },
        ],
      },
      {
        kind: 'action',
        items: [{ label: 'New activity', to: '/activities/new', icon: Plus }],
      },
    ];
  }

  return [];
}
