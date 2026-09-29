import type { ReactNode } from 'react';
import { BrandMark, DawnBackdrop } from '@evolveiq/ui';
import { AccountMenu } from './AccountMenu';
import { AppBottomNav } from './AppBottomNav';
import { AppSidebar, type AppSidebarProps } from './AppSidebar';

export interface AppLayoutProps extends Omit<AppSidebarProps, 'className'> {
  children: ReactNode;
}

/**
 * Page frame shared by all three apps. On desktop, a floating rail beside the
 * content; on phones, a slim header with the account menu and a tab bar at
 * the bottom. Both read the same menu config.
 */
export function AppLayout({ children, ...shellProps }: AppLayoutProps) {
  return (
    <div className="relative min-h-dvh">
      <DawnBackdrop />
      <AppSidebar {...shellProps} />

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-white/60 bg-white/70 px-4 backdrop-blur-xl sm:px-6 lg:hidden">
        <div className="flex items-center gap-2.5">
          <BrandMark size="sm" />
          <p className="text-base font-semibold tracking-tight text-ink">{shellProps.appName}</p>
        </div>
        <AccountMenu
          userName={shellProps.userName}
          roleLabel={shellProps.roleLabel}
          onSignOut={shellProps.onSignOut}
        />
      </header>

      <div className="lg:pl-[17.5rem]">
        <main className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>

      <AppBottomNav sections={shellProps.sections} />
    </div>
  );
}
