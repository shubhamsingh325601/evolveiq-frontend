import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Role } from '@evolveiq/api-client';
import { isRoleAllowed, ROLE_HOME_PATH } from './role-access';
import { useAuth } from './useAuth';

export interface RoleGuardProps {
  allow: Role[];
  /** Where to send a signed-out visitor. */
  signInPath?: string;
}

/**
 * Route guard for a whole branch of the route tree. Screens never check roles
 * themselves — if a route is reachable, the data on it is allowed.
 */
export function RoleGuard({ allow, signInPath = '/sign-in' }: RoleGuardProps) {
  const { user, role, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper text-ink-muted">
        <p className="text-sm">Checking your sign-in…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={signInPath} state={{ from: location.pathname }} replace />;
  }

  if (!isRoleAllowed(role, allow)) {
    return <Navigate to={role ? ROLE_HOME_PATH[role] : signInPath} replace />;
  }

  return <Outlet />;
}
