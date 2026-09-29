import { useEffect, useId, useRef, useState } from 'react';
import { Avatar, cn, LogOut } from '@evolveiq/ui';

export interface AccountMenuProps {
  userName: string;
  roleLabel: string;
  onSignOut: () => void;
  className?: string;
}

/**
 * Who is signed in, and the way out, behind the avatar in the phone header.
 * On desktop the rail shows the same thing permanently.
 */
export function AccountMenu({ userName, roleLabel, onSignOut, className }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

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

  return (
    <div ref={rootRef} className={cn('relative', className)}>
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

      {isOpen ? (
        <div
          id={panelId}
          className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right animate-rise rounded-2xl border border-white/70 bg-white/95 p-2 shadow-overlay backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 px-3 py-3">
            <Avatar name={userName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{userName}</p>
              <p className="truncate text-xs text-ink-muted">{roleLabel}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-iris-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-iris-500"
          >
            <LogOut className="size-4 text-ink-muted" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
