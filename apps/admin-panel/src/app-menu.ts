import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { Award, Backpack, Contact, HeartHandshake, LayoutGrid, Megaphone, Plug, Presentation, School, Trophy, Upload } from '@evolveiq/ui';

/**
 * The admin panel's menu, by role. Consumed by the shared `AppSidebar` and `AppBottomNav`
 * (which keeps four tabs on a phone and puts the rest behind "More"). Import, the notice
 * board, staff reviews and the wall of fame came with the client's feedback of 29 Oct 2026.
 */
export function menuForRole(role: Role): SidebarMenuSection[] {
  if (role === 'school_admin') {
    return [
      {
        title: 'My school',
        items: [
          { label: 'Students', to: '/school/students', icon: Backpack },
          { label: 'Teachers', to: '/school/teachers', icon: Presentation },
          { label: 'Classes', to: '/school/classes', icon: LayoutGrid },
          { label: 'Parents', to: '/school/parents', icon: HeartHandshake },
          { label: 'Import data', shortLabel: 'Import', to: '/school/import', icon: Upload },
        ],
      },
      {
        title: 'School life',
        items: [
          { label: 'Notice board', shortLabel: 'Notices', to: '/school/notices', icon: Megaphone },
          { label: 'Staff reviews', shortLabel: 'Reviews', to: '/school/staff-reviews', icon: Award },
          { label: 'Wall of fame', shortLabel: 'Wall', to: '/school/wall', icon: Trophy },
        ],
      },
      {
        title: 'Connect',
        // Announced, not built: the screen says what it will do (client feedback, 28 Oct 2026).
        items: [{ label: 'CRM integration', shortLabel: 'CRM', to: '/school/integrations', icon: Plug, tag: 'Soon' }],
      },
    ];
  }

  if (role === 'platform_admin') {
    return [
      {
        title: 'Platform',
        items: [
          { label: 'Schools', to: '/platform/schools', icon: School },
          { label: 'People', to: '/platform/users', icon: Contact },
          { label: 'Import data', shortLabel: 'Import', to: '/platform/import', icon: Upload },
          { label: 'Notice board', shortLabel: 'Notices', to: '/platform/notices', icon: Megaphone },
        ],
      },
    ];
  }

  return [];
}
