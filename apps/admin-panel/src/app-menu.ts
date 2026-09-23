import type { Role } from '@evolveiq/api-client';
import type { SidebarMenuSection } from '@evolveiq/domain';

/** The admin panel's menu, by role. Consumed by the shared `AppSidebar`. */
export function menuForRole(role: Role): SidebarMenuSection[] {
  if (role === 'school-admin') {
    return [
      {
        title: 'My school',
        items: [
          { label: 'Students', to: '/school/students' },
          { label: 'Teachers', to: '/school/teachers' },
          { label: 'Classes', to: '/school/classes' },
          { label: 'Parents', to: '/school/parents' },
        ],
      },
    ];
  }

  if (role === 'platform-admin') {
    return [
      {
        title: 'Platform',
        items: [
          { label: 'Schools', to: '/platform/schools' },
          { label: 'People', to: '/platform/users' },
        ],
      },
    ];
  }

  return [];
}
