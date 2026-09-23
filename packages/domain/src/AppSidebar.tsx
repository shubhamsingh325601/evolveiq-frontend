import { NavLink } from 'react-router-dom';
import { cn } from '@evolveiq/ui';

/**
 * One sidebar shell for all three apps. Each app passes a menu config built
 * from the signed-in user's role — the component itself knows nothing about
 * roles, so a permission change never means editing this file.
 */

export interface SidebarMenuItem {
  label: string;
  to: string;
  /** Matches nested routes as well, e.g. a detail page under a list. */
  isEndMatch?: boolean;
  badge?: number;
}

export interface SidebarMenuSection {
  /** Groups items under a quiet heading. Omit for an ungrouped run. */
  title?: string;
  items: SidebarMenuItem[];
}

export interface AppSidebarProps {
  appName: string;
  /** The signed-in role, shown under the product name. */
  roleLabel: string;
  sections: SidebarMenuSection[];
  userName: string;
  onSignOut: () => void;
  /** Mobile drawer state; on desktop the sidebar is always visible. */
  isOpen?: boolean;
  onNavigate?: () => void;
}

export function AppSidebar({
  appName,
  roleLabel,
  sections,
  userName,
  onSignOut,
  isOpen = false,
  onNavigate,
}: AppSidebarProps) {
  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-teal-800 text-ink-inverse transition-transform duration-200 lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <p className="text-lg font-semibold tracking-tight">{appName}</p>
        <p className="mt-0.5 text-sm text-teal-200">{roleLabel}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {sections.map((section, sectionIndex) => (
          <div key={section.title ?? `section-${sectionIndex}`} className="mb-5 last:mb-0">
            {section.title ? (
              <p className="px-2 pb-2 text-sm font-medium text-teal-300">{section.title}</p>
            ) : null}
            <ul className="flex flex-col gap-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.isEndMatch ?? false}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center justify-between rounded px-3 py-2 text-sm transition-colors',
                        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200',
                        isActive
                          ? 'bg-teal-600 font-medium text-white'
                          : 'text-teal-100 hover:bg-white/5 hover:text-white',
                      )
                    }
                  >
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="ml-2 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-medium tabular-nums text-teal-900">
                        {item.badge}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="truncate text-sm font-medium text-white">{userName}</p>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-1 rounded text-sm text-teal-200 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
