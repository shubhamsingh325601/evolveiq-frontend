import { Outlet } from 'react-router-dom';
import { useObservations } from '@evolveiq/api-client';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';

export function AppFrame() {
  const { user, signOut } = useAuth();
  // Drives the count beside "Review queue" in the sidebar.
  const pending = useObservations({ status: 'pending' });

  if (!user) return null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role, (pending.data ?? []).length)}
      userName={user.name}
      onSignOut={signOut}
    >
      <Outlet />
    </AppLayout>
  );
}
