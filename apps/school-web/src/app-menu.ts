import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';

/** The school app's menu, by role. Consumed by the shared `AppSidebar`. */
export function menuForRole(role: Role, pendingReviewCount = 0): SidebarMenuSection[] {
  if (role === 'teacher') {
    return [
      {
        items: [
          { label: 'My students', to: '/teacher/students', isEndMatch: true },
          { label: 'Assign an activity', to: '/teacher/assign' },
        ],
      },
      {
        title: 'Add',
        items: [{ label: 'New observation', to: '/teacher/observations/new' }],
      },
    ];
  }

  if (role === 'psychologist') {
    return [
      {
        items: [
          {
            label: 'Review queue',
            to: '/review-queue',
            isEndMatch: true,
            badge: pendingReviewCount,
          },
          { label: 'Activity library', to: '/activities', isEndMatch: true },
        ],
      },
      {
        title: 'Add',
        items: [{ label: 'New activity', to: '/activities/new' }],
      },
    ];
  }

  return [];
}
