import { ROLE_APP, useAuth } from '@evolveiq/auth';
import { App as FamilyApp } from '@family-web/App';
import { App as SchoolApp } from '@school-web/App';
import { App as AdminApp } from '@admin-panel/App';
import { RolePicker } from './RolePicker';
import { RoleSwitcher } from './RoleSwitcher';

/**
 * Mounts exactly one product app at a time, chosen by the signed-in role.
 *
 * Only one route tree is ever live, so each app's absolute routes
 * (`/parent/children`, `/review-queue`, `/school/students`) behave exactly as
 * they do when that app runs on its own.
 */
const APPS = {
  family: FamilyApp,
  school: SchoolApp,
  admin: AdminApp,
} as const;

export function DevShell() {
  const { user, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-paper text-ink-muted">
        <p className="text-sm">Starting up…</p>
      </div>
    );
  }

  if (!user) return <RolePicker />;

  const ActiveApp = APPS[ROLE_APP[user.role]];

  return (
    <>
      <ActiveApp />
      <RoleSwitcher />
    </>
  );
}
