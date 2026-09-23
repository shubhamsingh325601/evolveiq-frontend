import { Outlet } from 'react-router-dom';
import { ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';

export function AppFrame() {
  const { user, signOut } = useAuth();

  if (!user) return null;

  return (
    <AppLayout
      appName="EvolvIQ"
      roleLabel={ROLE_LABELS[user.role]}
      sections={menuForRole(user.role)}
      userName={user.name}
      onSignOut={signOut}
    >
      <Outlet />
    </AppLayout>
  );
}
