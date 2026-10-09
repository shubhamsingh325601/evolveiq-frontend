import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Avatar,
  BrandMark,
  ChevronsLeft,
  ChevronsRight,
  cn,
  GrowthRings,
  LogOut,
  Plus,
  type IconComponent,
} from '@evolveiq/ui';

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
  /** The signed-in role, shown on the chip under the brand. */
  roleLabel: string;
  sections: SidebarMenuSection[];
  userName: string;
  onSignOut: () => void;
  /** Where this person works, such as "Ridgeview Primary"; shown under their name. */
  contextLabel?: string;
  /** What this person should know at a glance, supplied by their app. */
  contextCard?: ReactNode;
  /** Narrows the rail to its icons. `AppLayout` owns and remembers this. */
  isCollapsed?: boolean;
  onToggleCollapsed?: () => void;
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
  contextLabel,
  contextCard,
  isCollapsed = false,
  onToggleCollapsed,
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
        'fixed inset-y-3 left-3 z-40 hidden flex-col overflow-hidden rounded-3xl bg-rail text-white shadow-raised transition-[width] duration-300 ease-out lg:flex',
        isCollapsed ? 'w-[5.25rem]' : 'w-[16.5rem]',
        className,
      )}
    >
      <GrowthRings className="pointer-events-none absolute -right-56 -top-56 size-[26rem] text-white/[0.05]" />

      <div className={cn('relative flex items-center gap-3 pt-6', isCollapsed ? 'flex-col px-3' : 'px-5')}>
        <BrandMark />
        {isCollapsed ? null : (
          <p className="min-w-0 flex-1 truncate text-lg font-black tracking-tight">{appName}</p>
        )}
        {onToggleCollapsed ? (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            title={isCollapsed ? 'Expand the sidebar' : 'Collapse the sidebar'}
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/10 hover:text-white',
              FOCUS_ON_NIGHT,
            )}
          >
            {isCollapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
          </button>
        ) : null}
      </div>

      {isCollapsed ? null : (
        <div className="relative px-5 pt-3">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-inset ring-white/10">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-jade-300 shadow-[0_0_0_3px_rgba(114,208,170,0.22)]"
            />
            <span>{roleLabel}</span>
          </p>
        </div>
      )}

      {contextCard && !isCollapsed ? <div className="relative px-4 pt-5">{contextCard}</div> : null}

      {actionItems.length > 0 ? (
        <div className={cn('relative flex flex-col gap-2 pt-5', isCollapsed ? 'px-3' : 'px-4')}>
          {actionItems.map((item) => {
            const Icon = item.icon ?? Plus;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.isEndMatch ?? false}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-iris-500 to-lilac-500 px-4 text-sm font-semibold text-white shadow-glow transition-[filter,box-shadow] hover:brightness-110',
                    isActive && 'ring-2 ring-inset ring-white/40',
                    FOCUS_ON_NIGHT,
                  )
                }
              >
                <Icon className="size-[18px] shrink-0" />
                {isCollapsed ? <span className="sr-only">{item.label}</span> : item.label}
              </NavLink>
            );
          })}
        </div>
      ) : null}

      <div className="relative flex-1 overflow-y-auto px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {linkSections.map((section, sectionIndex) => (
          <div key={section.title ?? `section-${sectionIndex}`} className="mb-5 last:mb-0">
            {section.title ? (
              isCollapsed ? (
                sectionIndex > 0 ? <div aria-hidden="true" className="mx-3 mb-4 border-t border-white/10" /> : null
              ) : (
                <p className="px-3 pb-2 text-[0.6875rem] font-semibold text-white/40">
                  {section.title}
                </p>
              )
            ) : null}
            <ul className="flex flex-col gap-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const badge = item.badge ?? 0;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.isEndMatch ?? false}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-2xl p-1.5 text-sm transition-[background-color,color]',
                          isCollapsed && 'justify-center',
                          FOCUS_ON_NIGHT,
                          isActive
                            ? 'bg-gradient-to-r from-iris-500/95 to-lilac-500/80 font-semibold text-white shadow-glow'
                            : 'font-medium text-white/65 hover:bg-white/[0.06] hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={cn(
                              'relative flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors',
                              isActive ? 'bg-white/15 text-white' : 'bg-white/[0.06] text-white/60 group-hover:text-white',
                            )}
                          >
                            {Icon ? (
                              <Icon className="size-[18px]" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-current" />
                            )}
                            {isCollapsed && badge > 0 ? (
                              <span className="absolute -right-1.5 -top-1.5 min-w-[1.125rem] rounded-full bg-honey-400 px-1 text-center text-[0.625rem] font-bold leading-[1.125rem] tabular-nums text-night ring-2 ring-night">
                                {badge}
                              </span>
                            ) : null}
                          </span>
                          {isCollapsed ? (
                            <span className="sr-only">{item.label}</span>
                          ) : (
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                          )}
                          {!isCollapsed && badge > 0 ? (
                            <span className="mr-1.5 min-w-[1.5rem] rounded-full bg-honey-400 px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-night">
                              {badge}
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

      <div
        className={cn(
          'relative m-3 mt-0 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-inset ring-white/10',
          isCollapsed && 'flex-col',
        )}
      >
        <Avatar name={userName} />
        {isCollapsed ? null : (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{userName}</p>
            {contextLabel ? <p className="truncate text-xs text-white/55">{contextLabel}</p> : null}
          </div>
        )}
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
