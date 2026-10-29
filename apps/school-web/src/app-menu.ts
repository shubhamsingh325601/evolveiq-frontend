import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { BookOpen, ClipboardCheck, ClipboardList, Inbox, Megaphone, Plus, UsersRound } from '@evolveiq/ui';

const NOTICE_BOARD = { label: 'Notice board', shortLabel: 'Notices', to: '/notices', icon: Megaphone };

/**
 * The school app's menu, by role. Consumed by the shared `AppSidebar` and `AppBottomNav`.
 * Attendance and the notice board came with the client's feedback of 29 Oct 2026.
 */
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
          { label: 'Attendance', to: '/teacher/attendance', icon: ClipboardCheck },
          {
            label: 'Assign an activity',
            shortLabel: 'Assign',
            to: '/teacher/assign',
            icon: ClipboardList,
          },
        ],
      },
      { title: 'School', items: [NOTICE_BOARD] },
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
      { title: 'School', items: [NOTICE_BOARD] },
    ];
  }

  return [];
}
