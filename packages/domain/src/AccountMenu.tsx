import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, Check, ChevronRight, cn, LogOut, type IconComponent } from '@evolveiq/ui';

export interface AccountMenuItem {
  /** Unique within its section. */
  id: string;
  label: string;
  /** A second line, such as a child's stars or who a test account is. */
  detail?: string;
  /** Somewhere to go… */
  to?: string;
  /** …or something to do. */
  onSelect?: () => void;
  /** Marks the one in use: the child on screen, the role signed in. */
  isCurrent?: boolean;
  /** Drawn instead of the person's initials. */
  icon?: IconComponent;
}

export interface AccountMenuSection {
  title: string;
  items: AccountMenuItem[];
}

export interface AccountMenuProps {
  userName: string;
  roleLabel: string;
  onSignOut: () => void;
  /**
   * Extra groups above "Sign out", supplied by the app or the shell: a
   * parent's children to move between, or the roles a test build lets staff
   * switch to. The menu itself knows nothing about roles.
   */
  sections?: AccountMenuSection[];
  /**
   * `bar` is the avatar in the phone header, opening below it. `rail` is the
   * account row at the foot of the desktop rail, opening above it.
   */
  placement?: 'bar' | 'rail';
  /** Shown under the name on the rail, such as the school. */
  contextLabel?: string;
  /** The rail narrowed to its icons: only the avatar shows. */
  isCollapsed?: boolean;
  className?: string;
}

const ITEM_CLASSES =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink transition-colors hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-iris-500';

/**
 * Who is signed in, what they can switch between, and the way out. Behind the
 * avatar in the phone header, and behind the account row on the desktop rail.
 */
export function AccountMenu({
  userName,
  roleLabel,
  onSignOut,
  sections = [],
  placement = 'bar',
  contextLabel,
  isCollapsed = false,
  className,
}: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const isRail = placement === 'rail';
  const visibleSections = sections.filter((section) => section.items.length > 0);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const choose = (item: AccountMenuItem) => {
    setIsOpen(false);
    item.onSelect?.();
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {isRail ? (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((current) => !current)}
          title={isCollapsed ? userName : undefined}
          className={cn(
            'flex w-full min-w-0 items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-white/[0.06]',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80',
            isOpen && 'bg-white/[0.08]',
            isCollapsed && 'justify-center',
          )}
        >
          <span className="sr-only">Account</span>
          <Avatar name={userName} />
          {isCollapsed ? null : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">{userName}</span>
                {contextLabel ? <span className="block truncate text-xs text-white/55">{contextLabel}</span> : null}
              </span>
              <ChevronRight
                className={cn('size-4 shrink-0 text-white/45 transition-transform', isOpen ? '-rotate-90' : 'rotate-0')}
              />
            </>
          )}
        </button>
      ) : (
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((current) => !current)}
          className="flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
        >
          <span className="sr-only">Account</span>
          <Avatar name={userName} size="sm" />
        </button>
      )}

      {isOpen ? (
        <div
          id={panelId}
          className={cn(
            'z-50 w-72 animate-rise rounded-2xl border border-white/70 bg-white/95 p-2 text-ink shadow-overlay backdrop-blur-xl',
            // The rail clips what overflows it, so its panel is placed against the window instead.
            isRail
              ? cn('fixed origin-bottom-left', isCollapsed ? 'bottom-3 left-[5.75rem]' : 'bottom-[4.75rem] left-3')
              : 'absolute right-0 top-full mt-2 origin-top-right',
          )}
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={userName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{userName}</p>
              <p className="truncate text-xs text-ink-muted">{roleLabel}</p>
            </div>
          </div>

          {visibleSections.map((section) => (
            <div key={section.title} className="border-t border-line-soft py-1.5">
              <p className="px-3 pb-1 pt-1.5 text-[0.6875rem] font-semibold text-ink-faint">{section.title}</p>
              <ul>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const body = (
                    <>
                      {Icon ? (
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-iris-50 text-iris-600">
                          <Icon className="size-4" />
                        </span>
                      ) : (
                        <Avatar name={item.label} size="sm" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{item.label}</span>
                        {item.detail ? (
                          <span className="block truncate text-xs text-ink-muted">{item.detail}</span>
                        ) : null}
                      </span>
                      {item.isCurrent ? <Check className="size-4 shrink-0 text-iris-600" strokeWidth={2.5} /> : null}
                    </>
                  );
                  return (
                    <li key={item.id}>
                      {item.to ? (
                        <Link
                          to={item.to}
                          aria-current={item.isCurrent ? 'page' : undefined}
                          onClick={() => choose(item)}
                          className={cn(ITEM_CLASSES, item.isCurrent && 'bg-iris-50/70')}
                        >
                          {body}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          aria-current={item.isCurrent ? 'true' : undefined}
                          disabled={item.isCurrent}
                          onClick={() => choose(item)}
                          className={cn(ITEM_CLASSES, item.isCurrent && 'cursor-default bg-iris-50/70')}
                        >
                          {body}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          <div className={cn(visibleSections.length > 0 && 'border-t border-line-soft pt-1.5')}>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onSignOut();
              }}
              className={ITEM_CLASSES}
            >
              <LogOut className="size-4 text-ink-muted" />
              Sign out
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
