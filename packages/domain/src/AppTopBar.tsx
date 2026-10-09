import { BrandMark, School } from '@evolveiq/ui';
import { AccountMenu } from './AccountMenu';
import { NotificationsMenu, type AppNotification } from './NotificationsMenu';

export interface AppTopBarProps {
  appName: string;
  roleLabel: string;
  userName: string;
  onSignOut: () => void;
  /** Where this person works, such as "Ridgeview Primary". */
  contextLabel?: string;
  /** Omit to leave the bell out, for a role that has nothing to be told. */
  notifications?: AppNotification[];
  notificationsKey?: string;
}

const TODAY = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

/**
 * The bar across the top of every signed-in screen. On desktop it says where
 * and when; on phones it carries the brand and the account menu, since the
 * rail is replaced by the tab bar. The bell sits in it at every size.
 */
export function AppTopBar({
  appName,
  roleLabel,
  userName,
  onSignOut,
  contextLabel,
  notifications,
  notificationsKey,
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/65 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 w-full max-w-[76rem] items-center justify-between gap-3 px-4 sm:px-6 lg:h-[4.5rem] lg:px-10">
        <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
          <BrandMark size="sm" />
          <div className="min-w-0">
            <p className="text-base font-black leading-5 tracking-tight text-ink">{appName}</p>
            <p className="truncate text-[0.625rem] font-bold uppercase leading-3 tracking-widest text-ink-faint">
              {roleLabel}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-3 lg:flex">
          {contextLabel ? (
            <p className="inline-flex min-w-0 items-center gap-2 rounded-full bg-white/85 px-3.5 py-1.5 text-sm font-semibold text-ink shadow-card ring-1 ring-inset ring-line/70">
              <School className="size-4 shrink-0 text-iris-500" />
              <span className="truncate">{contextLabel}</span>
            </p>
          ) : null}
          <p className="whitespace-nowrap text-sm font-medium text-ink-muted">
            {TODAY.format(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {notifications ? (
            <NotificationsMenu items={notifications} storageKey={notificationsKey ?? userName} />
          ) : null}
          <div className="lg:hidden">
            <AccountMenu userName={userName} roleLabel={roleLabel} onSignOut={onSignOut} />
          </div>
        </div>
      </div>
    </header>
  );
}
