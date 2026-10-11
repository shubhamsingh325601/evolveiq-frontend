import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';
import { Backpack, Contact, HeartHandshake, LayoutGrid, Presentation, School } from '@evolveiq/ui';

/** The admin panel's menu, by role. Consumed by the shared `AppSidebar` and `AppBottomNav`. */
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
        ],
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
        ],
      },
    ];
  }

  return [];
}
