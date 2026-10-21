import { useState, type ReactNode } from 'react';
import { ArrowLeftRight, cn, DawnBackdrop } from '@evolveiq/ui';
import type { AccountMenuSection } from './AccountMenu';
import { AppBottomNav } from './AppBottomNav';
import { AppSidebar, type AppSidebarProps } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import type { AppNotification } from './NotificationsMenu';
import { useAccountSwitch } from './useAccountSwitch';

export interface AppLayoutProps
  extends Omit<AppSidebarProps, 'className' | 'isCollapsed' | 'onToggleCollapsed'> {
  children: ReactNode;
  /** For the bell in the top bar. Omit to leave the bell out. */
  notifications?: AppNotification[];
  /** Keeps what each person has read apart; usually their user id. */
  notificationsKey?: string;
}

const COLLAPSED_KEY = 'evolveiq.sidebar.collapsed';

function readIsCollapsed(): boolean {
  try {
    return window.localStorage.getItem(COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Page frame shared by all three apps. On desktop, a rail flush with the
 * window's left edge, which narrows to its icons and remembers that choice; on phones, a
 * slim header and a tab bar at the bottom. Both read the same menu config.
 * Printing drops the navigation, so a saved report is just the report.
 */
export function AppLayout({
  children,
  notifications,
  notificationsKey,
  accountSections = [],
  ...shellProps
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(readIsCollapsed);
  const accountSwitch = useAccountSwitch();

  // The app's own groups (a parent's children), then whatever the shell offers.
  const sections: AccountMenuSection[] =
    accountSwitch && accountSwitch.accounts.length > 0
      ? [
          ...accountSections,
          {
            title: accountSwitch.title,
            items: accountSwitch.accounts.map((account) => ({
              id: account.id,
              label: account.label,
              icon: account.icon ?? ArrowLeftRight,
              isCurrent: account.id === accountSwitch.currentId,
              onSelect: () => accountSwitch.switchTo(account.id),
              ...(account.detail ? { detail: account.detail } : {}),
            })),
          },
        ]
      : accountSections;

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    try {
      window.localStorage.setItem(COLLAPSED_KEY, String(next));
    } catch {
      // Blocked storage only means the rail opens wide again next time.
    }
  };

  return (
    <div className="relative min-h-dvh">
      <DawnBackdrop />
      <AppSidebar
        {...shellProps}
        accountSections={sections}
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
        className="print:hidden"
      />

      <div
        className={cn(
          'transition-[padding] duration-300 ease-out print:pl-0',
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64',
        )}
      >
        <AppTopBar
          appName={shellProps.appName}
          roleLabel={shellProps.roleLabel}
          userName={shellProps.userName}
          onSignOut={shellProps.onSignOut}
          accountSections={sections}
          {...(shellProps.contextLabel ? { contextLabel: shellProps.contextLabel } : {})}
          {...(notifications ? { notifications } : {})}
          {...(notificationsKey ? { notificationsKey } : {})}
        />
        <main className="mx-auto w-full max-w-[76rem] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-8 print:p-0">
          {children}
        </main>
      </div>

      <AppBottomNav sections={shellProps.sections} className="print:hidden" />
    </div>
  );
}
