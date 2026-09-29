import { NavLink } from 'react-router-dom';
import { Avatar, BrandMark, cn, LogOut, Plus, type IconComponent } from '@evolveiq/ui';

/**
 * One navigation shell for all three apps. Each app passes a menu config built
 * from the signed-in user's role — the component itself knows nothing about
 * roles, so a permission change never means editing this file.
 *
 * The same config drives `AppBottomNav` on phones; this is the desktop rail.
 */

export interface SidebarMenuItem {
  label: string;
  /** A shorter label for the phone tab bar, where space is tight. */
  shortLabel?: string;
  to: string;
  /**
   * Highlight only on this exact path. Leave it off for a list whose detail
   * pages should keep the list highlighted.
   */
  isEndMatch?: boolean;
  badge?: number;
  icon?: IconComponent;
}

export interface SidebarMenuSection {
  /** Groups items under a quiet heading. Omit for an ungrouped run. */
  title?: string;
  /**
   * `action` holds the thing a role creates most often. It is drawn as the
   * rail's prominent button and the tab bar's raised button, not as a link.
   */
  kind?: 'links' | 'action';
  items: SidebarMenuItem[];
}

export interface AppSidebarProps {
  appName: string;
  /** The signed-in role, shown under the user's name. */
  roleLabel: string;
  sections: SidebarMenuSection[];
  userName: string;
  onSignOut: () => void;
  className?: string;
}

const FOCUS_ON_NIGHT =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80';

export function AppSidebar({
  appName,
  roleLabel,
  sections,
  userName,
  onSignOut,
  className,
}: AppSidebarProps) {
  const actionItems = sections
    .filter((section) => section.kind === 'action')
    .flatMap((section) => section.items);
  const linkSections = sections.filter((section) => section.kind !== 'action');

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-y-3 left-3 z-40 hidden w-64 flex-col overflow-hidden rounded-3xl bg-rail text-white shadow-raised lg:flex',
        className,
      )}
    >
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <BrandMark />
        <p className="text-lg font-semibold tracking-tight">{appName}</p>
      </div>

      {actionItems.length > 0 ? (
        <div className="flex flex-col gap-2 px-4 pb-2">
          {actionItems.map((item) => {
            const Icon = item.icon ?? Plus;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.isEndMatch ?? false}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-iris-500 to-lilac-500 px-4 text-sm font-medium text-white shadow-glow transition-[filter,box-shadow] hover:brightness-110',
                    isActive && 'ring-2 ring-inset ring-white/40',
                    FOCUS_ON_NIGHT,
                  )
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      ) : null}

      <div className="flex-1 overflow-y-auto px-3 py-4">
        {linkSections.map((section, sectionIndex) => (
          <div key={section.title ?? `section-${sectionIndex}`} className="mb-6 last:mb-0">
            {section.title ? (
              <p className="px-3 pb-2 text-xs font-medium text-white/50">{section.title}</p>
            ) : null}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.isEndMatch ?? false}
                      className={({ isActive }) =>
                        cn(
                          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                          FOCUS_ON_NIGHT,
                          isActive
                            ? 'bg-white/[0.12] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                            : 'text-white/70 hover:bg-white/[0.06] hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {Icon ? (
                            <Icon
                              className={cn(
                                'size-[18px] shrink-0 transition-colors',
                                isActive ? 'text-iris-200' : 'text-white/50 group-hover:text-white/80',
                              )}
                            />
                          ) : null}
                          <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 ? (
                            <span className="min-w-[1.375rem] rounded-full bg-honey-400 px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums text-night">
                              {item.badge}
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="m-3 mt-0 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-3">
        <Avatar name={userName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{userName}</p>
          <p className="truncate text-xs text-white/60">{roleLabel}</p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white',
            FOCUS_ON_NIGHT,
          )}
        >
          <LogOut className="size-[18px]" />
        </button>
      </div>
    </nav>
  );
}
