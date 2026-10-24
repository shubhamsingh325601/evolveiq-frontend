import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { FEATURES } from '@evolveiq/api-client';
import { Compass, Heart, House, NotebookPen, Plus, ShieldCheck, Sprout, Users } from '@evolveiq/ui';

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
          { label: 'How I feel', shortLabel: 'Feel', to: '/student/wellbeing', icon: Heart },
          { label: 'Explore', to: '/student/explore', icon: Compass },
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
          ...(FEATURES.holisticIndex
            ? [{ label: 'Siblings', to: '/parent/siblings', icon: Users }]
            : []),
          { label: 'Privacy & safety', shortLabel: 'Privacy', to: '/parent/privacy', icon: ShieldCheck },
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
