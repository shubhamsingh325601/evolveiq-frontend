import { NavLink } from 'react-router-dom';
import { cn, Plus } from '@evolveiq/ui';
import type { SidebarMenuSection } from './AppSidebar';

export interface AppBottomNavProps {
  /** The same role-based config the rail takes, so the two never disagree. */
  sections: SidebarMenuSection[];
  className?: string;
}

/**
 * Navigation on phones and small tablets: a floating tab bar within thumb
 * reach. A role's action, if it has one, becomes the raised button in the
 * middle; every other item is a tab.
 */
export function AppBottomNav({ sections, className }: AppBottomNavProps) {
  const links = sections
    .filter((section) => section.kind !== 'action')
    .flatMap((section) => section.items);
  const action = sections
    .filter((section) => section.kind === 'action')
    .flatMap((section) => section.items)[0];

  const middle = Math.ceil(links.length / 2);
  const slots = action
    ? [...links.slice(0, middle), action, ...links.slice(middle)]
    : links;

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden',
        className,
      )}
    >
      <ul className="mx-auto flex max-w-md items-end justify-around gap-1 rounded-3xl border border-white/70 bg-white/80 p-1.5 shadow-raised backdrop-blur-xl">
        {slots.map((item) => {
          if (item === action) {
            const ActionIcon = item.icon ?? Plus;
            return (
              <li key={item.to} className="flex flex-1 justify-center">
                <NavLink
                  to={item.to}
                  end={item.isEndMatch ?? false}
                  aria-label={item.label}
                  className="-mt-7 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-iris-500 to-lilac-500 text-white shadow-glow ring-4 ring-mist transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
                >
                  <ActionIcon className="size-6" />
                </NavLink>
              </li>
            );
          }

          const Icon = item.icon;
          const visibleLabel = item.shortLabel ?? item.label;
          return (
            <li key={item.to} className="min-w-0 flex-1">
              <NavLink
                to={item.to}
                end={item.isEndMatch ?? false}
                className={({ isActive }) =>
                  cn(
                    'relative flex flex-col items-center gap-0.5 rounded-2xl px-1 py-1 text-[0.6875rem] font-medium transition-colors',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
                    isActive ? 'text-iris-700' : 'text-ink-muted hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                        isActive && 'bg-iris-100',
                      )}
                    >
                      {Icon ? (
                        <Icon className="size-5" />
                      ) : (
                        <span className="size-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span aria-hidden="true" className="max-w-full truncate">
                      {visibleLabel}
                    </span>
                    <span className="sr-only">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 ? (
                      <span className="absolute left-1/2 top-0 ml-2 min-w-[1.125rem] rounded-full bg-honey-400 px-1 text-center text-[0.625rem] font-semibold leading-[1.125rem] tabular-nums text-night ring-2 ring-white">
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
    </nav>
  );
}
