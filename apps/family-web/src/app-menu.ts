import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';

/**
 * The family app's menu, by role. `AppSidebar` is shared across all three apps
 * and takes this config — it is never forked per role or per app.
 */
export function menuForRole(role: Role): SidebarMenuSection[] {
  if (role === 'student') {
    return [
      {
        items: [
          { label: 'Today', to: '/student/today', isEndMatch: true },
          { label: 'My progress', to: '/student/progress' },
        ],
      },
    ];
  }

  if (role === 'parent') {
    return [
      {
        items: [
          { label: 'My children', to: '/parent/children', isEndMatch: true },
          { label: 'Observations', to: '/parent/observations', isEndMatch: true },
        ],
      },
      {
        title: 'Add',
        items: [{ label: 'New observation', to: '/parent/observations/new' }],
      },
    ];
  }

  return [];
}
