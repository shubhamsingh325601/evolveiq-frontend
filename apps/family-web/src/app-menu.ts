import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { NotebookPen, Plus, Sprout, Sun, UsersRound } from '@evolveiq/ui';

/**
 * The family app's menu, by role. `AppSidebar` and `AppBottomNav` are shared
 * across all three apps and take this config — never forked per role or app.
 */
export function menuForRole(role: Role): SidebarMenuSection[] {
  if (role === 'student') {
    return [
      {
        items: [
          { label: 'Today', to: '/student/today', icon: Sun },
          { label: 'My progress', shortLabel: 'Progress', to: '/student/progress', icon: Sprout },
        ],
      },
    ];
  }

  if (role === 'parent') {
    return [
      {
        items: [
          { label: 'My children', shortLabel: 'Children', to: '/parent/children', icon: UsersRound },
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
