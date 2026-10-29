import { useEffect, useId, useRef, useState } from 'react';
import { matchPath, NavLink, useLocation } from 'react-router-dom';
import { cn, Ellipsis, Plus } from '@evolveiq/ui';
import type { SidebarMenuItem, SidebarMenuSection } from './AppSidebar';

export interface AppBottomNavProps {
  /** The same role-based config the rail takes, so the two never disagree. */
  sections: SidebarMenuSection[];
  className?: string;
}

/** A phone's tab bar fits five targets; past that, the rest go behind "More". */
const MAX_SLOTS = 5;

function Badge({ item }: { item: SidebarMenuItem }) {
  if (item.badge !== undefined && item.badge > 0) {
    return (
      <span className="absolute left-1/2 top-0 ml-2 min-w-[1.125rem] rounded-full bg-honey-400 px-1 text-center text-[0.625rem] font-semibold leading-[1.125rem] tabular-nums text-night ring-2 ring-white">
        {item.badge}
      </span>
    );
  }
  return item.tag ? (
    <span
      aria-hidden="true"
      className="absolute left-1/2 top-0 ml-1.5 rounded-full bg-iris-100 px-1.5 text-[0.5625rem] font-bold uppercase leading-4 tracking-wide text-iris-700 ring-2 ring-white"
    >
      {item.tag}
    </span>
  ) : null;
}

const TAB_CLASSES =
  'relative flex w-full flex-col items-center gap-0.5 rounded-2xl px-1 py-1 text-[0.6875rem] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500';

function Tab({ item }: { item: SidebarMenuItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.isEndMatch ?? false}
      className={({ isActive }) => cn(TAB_CLASSES, isActive ? 'text-iris-700' : 'text-ink-muted hover:text-ink')}
    >
      {({ isActive }) => (
        <>
          <span className={cn('flex h-8 w-12 items-center justify-center rounded-full transition-colors', isActive && 'bg-iris-100')}>
            {Icon ? <Icon className="size-5" /> : <span className="size-1.5 rounded-full bg-current" />}
          </span>
          <span aria-hidden="true" className="max-w-full truncate">
            {item.shortLabel ?? item.label}
          </span>
          <span className="sr-only">
            {item.label}
            {item.tag ? ` (${item.tag})` : ''}
          </span>
          <Badge item={item} />
        </>
      )}
    </NavLink>
  );
}

/** The fifth tab when a role has more places than fit: a sheet of the rest. */
function MoreTab({ items }: { items: SidebarMenuItem[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const isActive = items.some((item) => matchPath({ path: item.to, end: item.isEndMatch ?? false }, pathname));
  const waiting = items.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  useEffect(() => setIsOpen(false), [pathname]);
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      {isOpen ? (
        <ul
          id={panelId}
          className="absolute bottom-[calc(100%+0.75rem)] right-0 z-10 flex w-60 animate-rise flex-col gap-1 rounded-2xl border border-line bg-white p-2 shadow-overlay"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.isEndMatch ?? false}
                  className={({ isActive: isHere }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-iris-500',
                      isHere ? 'bg-iris-50 text-iris-700' : 'text-ink hover:bg-iris-50',
                    )
                  }
                >
                  {Icon ? <Icon className="size-[18px] shrink-0 text-iris-600" /> : null}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.tag ? (
                    <span className="rounded-full bg-iris-100 px-1.5 text-[0.5625rem] font-bold uppercase leading-4 tracking-wide text-iris-700">
                      {item.tag}
                    </span>
                  ) : null}
                  {item.badge ? (
                    <span className="min-w-[1.25rem] rounded-full bg-honey-400 px-1.5 text-center text-xs font-bold tabular-nums text-night">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              </li>
            );
          })}
        </ul>
      ) : null}
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(TAB_CLASSES, isActive || isOpen ? 'text-iris-700' : 'text-ink-muted hover:text-ink')}
      >
        <span className={cn('flex h-8 w-12 items-center justify-center rounded-full transition-colors', (isActive || isOpen) && 'bg-iris-100')}>
          <Ellipsis className="size-5" />
        </span>
        <span>More</span>
        {waiting > 0 ? <Badge item={{ label: 'More', to: '', badge: waiting }} /> : null}
      </button>
    </div>
  );
}

/**
 * Navigation on phones and small tablets: a floating tab bar within thumb
 * reach. The raised button in the middle is the item marked `isCenter`, or
 * else the role's action; every other link is a tab. A role with more places
 * than five targets hold keeps the first tabs and puts the rest behind "More".
 */
export function AppBottomNav({ sections, className }: AppBottomNavProps) {
  const allLinks = sections
    .filter((section) => section.kind !== 'action')
    .flatMap((section) => section.items);
  const centerLink = allLinks.find((item) => item.isCenter);
  const action =
    centerLink ??
    sections.filter((section) => section.kind === 'action').flatMap((section) => section.items)[0];
  const links = allLinks.filter((item) => item !== centerLink);

  const maxLinks = action ? MAX_SLOTS - 1 : MAX_SLOTS;
  const hasMore = links.length > maxLinks;
  const tabs = hasMore ? links.slice(0, maxLinks - 1) : links;
  const more = hasMore ? links.slice(maxLinks - 1) : [];

  type Slot = { kind: 'tab'; item: SidebarMenuItem } | { kind: 'action'; item: SidebarMenuItem } | { kind: 'more' };
  const tabSlots: Slot[] = [...tabs.map((item): Slot => ({ kind: 'tab', item })), ...(hasMore ? [{ kind: 'more' } as Slot] : [])];
  const middle = Math.ceil(tabSlots.length / 2);
  const slots: Slot[] = action ? [...tabSlots.slice(0, middle), { kind: 'action', item: action }, ...tabSlots.slice(middle)] : tabSlots;

  return (
    <nav
      aria-label="Main"
      className={cn(
        'fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 lg:hidden',
        className,
      )}
    >
      <ul className="mx-auto flex max-w-md items-end justify-around gap-1 rounded-3xl border border-white/80 bg-white/90 p-1.5 shadow-raised backdrop-blur-xl">
        {slots.map((slot) => {
          if (slot.kind === 'more') {
            return (
              <li key="more" className="min-w-0 flex-1">
                <MoreTab items={more} />
              </li>
            );
          }
          const item = slot.item;
          if (slot.kind === 'action') {
            const ActionIcon = item.icon ?? Plus;
            // A place to go (not a thing to create) also names itself under the button.
            const hasLabel = item === centerLink;
            return (
              <li key={item.to} className="flex flex-1 justify-center">
                <NavLink
                  to={item.to}
                  end={item.isEndMatch ?? false}
                  aria-label={item.label}
                  className="group flex flex-col items-center gap-0.5 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          '-mt-7 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-iris-500 to-lilac-500 text-white shadow-glow ring-4 ring-mist transition-transform group-active:scale-95',
                          isActive && hasLabel && 'ring-iris-100',
                        )}
                      >
                        <ActionIcon className="size-6" />
                      </span>
                      {hasLabel ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'max-w-full truncate px-1 pb-1 text-[0.6875rem] font-semibold',
                            isActive ? 'text-iris-700' : 'text-ink-muted',
                          )}
                        >
                          {item.shortLabel ?? item.label}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              </li>
            );
          }
          return (
            <li key={item.to} className="min-w-0 flex-1">
              <Tab item={item} />
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
