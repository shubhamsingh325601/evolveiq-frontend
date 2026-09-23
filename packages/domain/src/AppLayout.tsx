import { useState, type ReactNode } from 'react';
import { AppSidebar, type AppSidebarProps } from './AppSidebar';

export interface AppLayoutProps extends Omit<AppSidebarProps, 'isOpen' | 'onNavigate'> {
  children: ReactNode;
}

/**
 * Page frame shared by all three apps: a persistent sidebar on desktop, the
 * same sidebar as a drawer on small screens, and the content column.
 */
export function AppLayout({ children, ...sidebarProps }: AppLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-paper">
      <AppSidebar
        {...sidebarProps}
        isOpen={isDrawerOpen}
        onNavigate={() => setIsDrawerOpen(false)}
      />

      {isDrawerOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-expanded={isDrawerOpen}
            className="flex size-9 items-center justify-center rounded border border-line bg-surface text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
          >
            <span className="sr-only">Open menu</span>
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="block h-px w-4 bg-ink" />
              <span className="block h-px w-4 bg-ink" />
              <span className="block h-px w-4 bg-ink" />
            </span>
          </button>
          <p className="text-sm font-medium text-ink">{sidebarProps.appName}</p>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
