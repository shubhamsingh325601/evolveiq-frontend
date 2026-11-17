import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import {
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  Inbox,
  LayoutGrid,
  LifeBuoy,
  Megaphone,
  MessageCircle,
  Plus,
  UsersRound,
} from '@evolveiq/ui';

const NOTICE_BOARD = { label: 'Notice board', shortLabel: 'Notices', to: '/notices', icon: Megaphone };
const TRAININGS = { label: 'Trainings', to: '/trainings', icon: GraduationCap };

/**
 * The school app's menu, by role. Consumed by the shared `AppSidebar` and `AppBottomNav`.
 * Attendance and the notice board came with the client's feedback of 29 Oct 2026.
 */
export function menuForRole(role: Role, pendingReviewCount = 0, unreadMessages = 0): SidebarMenuSection[] {
  if (role === 'teacher') {
    return [
      {
        kind: 'action',
        items: [{ label: 'New observation', to: '/teacher/observations/new', icon: Plus }],
      },
      {
        title: 'Classroom',
        items: [
          { label: 'Class overview', shortLabel: 'Class', to: '/teacher/class', icon: LayoutGrid },
          { label: 'My students', shortLabel: 'Students', to: '/teacher/students', icon: UsersRound },
          { label: 'Attendance', to: '/teacher/attendance', icon: ClipboardCheck },
          {
            label: 'Assign an activity',
            shortLabel: 'Assign',
            to: '/teacher/assign',
            icon: ClipboardList,
          },
          {
            label: 'NEP reports',
            shortLabel: 'Reports',
            to: '/teacher/reports',
            icon: FileText,
          },
          { label: 'Messages', to: '/messages', badge: unreadMessages, icon: MessageCircle },
          { label: 'Raise a ticket', shortLabel: 'IT help', to: '/teacher/help-desk', icon: LifeBuoy },
        ],
      },
      { title: 'School', items: [NOTICE_BOARD, TRAININGS] },
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
          { label: 'Messages', to: '/messages', badge: unreadMessages, icon: MessageCircle },
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
      { title: 'School', items: [NOTICE_BOARD, TRAININGS] },
    ];
  }

  return [];
}
