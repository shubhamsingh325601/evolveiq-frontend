import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, cn, type IconComponent } from '@evolveiq/ui';
import { formatRelativeDay } from './format-date';

export type AppNotificationTone = 'iris' | 'lilac' | 'jade' | 'honey' | 'coral' | 'star';

export interface AppNotification {
  id: string;
  title: string;
  detail?: string;
  /** When it happened, as an ISO timestamp. Newest shows first. */
  at: string;
  /** Where reading it should take you. */
  to?: string;
  /** Follows the hue's meaning: honey awaits review, coral is flagged, jade is done, gold is a star. */
  tone?: AppNotificationTone;
  icon?: IconComponent;
}

export interface NotificationsMenuProps {
  items: AppNotification[];
  /** Whose notifications these are, so what each person has seen is kept apart. */
  storageKey: string;
  className?: string;
}

const MAX_SHOWN = 8;

const WELL_CLASSES: Record<AppNotificationTone, string> = {
  iris: 'bg-iris-50 text-iris-600',
  lilac: 'bg-lilac-50 text-lilac-600',
  jade: 'bg-jade-50 text-jade-600',
  honey: 'bg-honey-50 text-honey-700',
  coral: 'bg-coral-50 text-coral-600',
  star: 'bg-star-50 text-star-600 [&>svg]:fill-star-400',
};

function readSeenAt(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSeenAt(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private browsing or blocked storage: they will simply show as new again.
  }
}

/**
 * The bell in the top bar. Items come from the app, built from data it
 * already has; this only lists them and remembers, in the browser, up to
 * when the person has read. Closing the panel marks everything shown as read.
 */
export function NotificationsMenu({ items, storageKey, className }: NotificationsMenuProps) {
  const seenKey = `evolveiq.notifications.seen.${storageKey}`;
  const [isOpen, setIsOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string | null>(() => readSeenAt(seenKey));
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const newestFirst = useMemo(
    () => [...items].sort((a, b) => b.at.localeCompare(a.at)).slice(0, MAX_SHOWN),
    [items],
  );
  const isUnread = (item: AppNotification) => seenAt === null || item.at > seenAt;
  const unreadCount = items.filter(isUnread).length;

  const markAllRead = () => {
    const newest = newestFirst[0]?.at;
    if (!newest) return;
    setSeenAt(newest);
    writeSeenAt(seenKey, newest);
  };

  const close = () => {
    setIsOpen(false);
    markAllRead();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // `close` is recreated each render; the listeners only need to follow `isOpen`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : 'Notifications'}
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className={cn(
          'relative flex size-10 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-iris-50 hover:text-iris-700',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500',
          isOpen && 'bg-iris-50 text-iris-700',
        )}
      >
        <Bell className="size-5" />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="absolute right-1 top-1 min-w-[1.125rem] rounded-full bg-coral-500 px-1 text-center text-[0.625rem] font-bold leading-[1.125rem] text-white ring-2 ring-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-[min(23rem,calc(100vw-2rem))] origin-top-right animate-rise overflow-hidden rounded-2xl border border-line/70 bg-white shadow-overlay"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4 py-3">
            <h2 className="text-sm font-black tracking-tight text-ink">Notifications</h2>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="rounded-md text-xs font-semibold text-iris-600 hover:text-iris-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-iris-500"
              >
                Mark all as read
              </button>
            ) : null}
          </div>

          {newestFirst.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-muted">You are all caught up.</p>
          ) : (
            <ul className="max-h-[24rem] overflow-y-auto p-2">
              {newestFirst.map((item) => {
                const Icon = item.icon ?? Bell;
                const isNew = isUnread(item);
                const content = (
                  <>
                    <span
                      aria-hidden="true"
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-xl',
                        WELL_CLASSES[item.tone ?? 'iris'],
                      )}
                    >
                      <Icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-5 text-ink">
                        {item.title}
                        {isNew ? <span className="sr-only">, new</span> : null}
                      </span>
                      {item.detail ? (
                        <span className="mt-0.5 line-clamp-2 block text-xs text-ink-muted">
                          {item.detail}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-[0.6875rem] font-medium text-ink-faint">
                        {formatRelativeDay(item.at)}
                      </span>
                    </span>
                    {isNew ? (
                      <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-iris-500" />
                    ) : null}
                  </>
                );
                const rowClasses = cn(
                  'flex items-start gap-3 rounded-xl p-3 text-left transition-colors',
                  isNew ? 'bg-iris-50/60' : '',
                );
                return (
                  <li key={item.id}>
                    {item.to ? (
                      <Link
                        to={item.to}
                        onClick={close}
                        className={cn(
                          rowClasses,
                          'hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-iris-500',
                        )}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={rowClasses}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
