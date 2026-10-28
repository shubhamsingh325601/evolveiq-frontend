import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { FEATURES } from '@evolveiq/api-client';
import { BotMessageSquare, Compass, Heart, House, NotebookPen, Plus, ShieldCheck, Sprout } from '@evolveiq/ui';

/**
 * The family app's menu, by role. `AppSidebar` and `AppBottomNav` are shared
 * across all three apps and take this config — never forked per role or app.
 *
 * The guide sits in the middle of the phone tab bar for both roles (client
 * feedback, 28 Oct 2026); a parent's "New observation" stays on the rail and
 * on their screens.
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
      {
        title: 'Help',
        items: [{ label: 'Ask EvolvIQ', shortLabel: 'Ask', to: '/student/ask', icon: BotMessageSquare, isCenter: true }],
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
          // Explore starts from a child's strengths, so it needs the Holistic Index.
          ...(FEATURES.holisticIndex ? [{ label: 'Explore', to: '/parent/explore', icon: Compass }] : []),
          { label: 'Privacy & safety', shortLabel: 'Privacy', to: '/parent/privacy', icon: ShieldCheck },
        ],
      },
      {
        title: 'Help',
        items: [{ label: 'Ask EvolvIQ', shortLabel: 'Ask', to: '/parent/ask', icon: BotMessageSquare, isCenter: true }],
      },
      {
        kind: 'action',
        items: [{ label: 'New observation', to: '/parent/observations/new', icon: Plus }],
      },
    ];
  }

  return [];
}
