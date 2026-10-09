import { useState, type ReactNode } from 'react';
import { cn, DawnBackdrop } from '@evolveiq/ui';
import { AppBottomNav } from './AppBottomNav';
import { AppSidebar, type AppSidebarProps } from './AppSidebar';
import { AppTopBar } from './AppTopBar';
import type { AppNotification } from './NotificationsMenu';

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
 * Page frame shared by all three apps. On desktop, a floating rail beside the
 * content, which narrows to its icons and remembers that choice; on phones, a
 * slim header and a tab bar at the bottom. Both read the same menu config.
 * Printing drops the navigation, so a saved report is just the report.
 */
export function AppLayout({
  children,
  notifications,
  notificationsKey,
  ...shellProps
}: AppLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(readIsCollapsed);

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
        isCollapsed={isCollapsed}
        onToggleCollapsed={toggleCollapsed}
        className="print:hidden"
      />

      <div
        className={cn(
          'transition-[padding] duration-300 ease-out print:pl-0',
          isCollapsed ? 'lg:pl-[6.75rem]' : 'lg:pl-[18rem]',
        )}
      >
        <AppTopBar
          appName={shellProps.appName}
          roleLabel={shellProps.roleLabel}
          userName={shellProps.userName}
          onSignOut={shellProps.onSignOut}
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
