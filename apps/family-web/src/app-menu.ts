import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { House, NotebookPen, Plus, Sprout } from '@evolveiq/ui';

/**
 * The family app's menu, by role. `AppSidebar` and `AppBottomNav` are shared
 * across all three apps and take this config — never forked per role or app.
 */
export function menuForRole(role: Role): SidebarMenuSection[] {
  if (role === 'student') {
    return [
      {
        title: 'Learning',
        items: [
          { label: 'Home', to: '/student/today', icon: House },
          { label: 'My progress', shortLabel: 'Progress', to: '/student/progress', icon: Sprout },
        ],
      },
    ];
  }

  if (role === 'parent') {
    return [
      {
        title: 'Family',
        items: [
          { label: 'Home', to: '/parent/children', icon: House },
          {
            label: 'Observations',
            to: '/parent/observations',
            isEndMatch: true,
            icon: NotebookPen,
          },
        ],
      },
      {
        kind: 'action',
        items: [{ label: 'New observation', to: '/parent/observations/new', icon: Plus }],
      },
    ];
  }

  return [];
}
