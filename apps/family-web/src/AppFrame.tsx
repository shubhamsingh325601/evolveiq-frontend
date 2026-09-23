import { Outlet } from 'react-router-dom';
import { useAuth, ROLE_LABELS } from '@evolveiq/auth';
import { AppLayout } from '@evolveiq/domain';
import { menuForRole } from './app-menu';

/** Wraps every signed-in route in the shared sidebar layout. */
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
