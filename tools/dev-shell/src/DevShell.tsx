import { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ROLE_APP, ROLE_HOME_PATH, ROLE_LABELS, useAuth } from '@evolveiq/auth';
import { AccountSwitchProvider, ROLE_ICONS, type AccountSwitchState } from '@evolveiq/domain';
import { DawnBackdrop, LoadingState } from '@evolveiq/ui';
import { App as FamilyApp } from '@family-web/App';
import { App as SchoolApp } from '@school-web/App';
import { App as AdminApp } from '@admin-panel/App';
import { SignInScreen } from './SignInScreen';
import { SWITCHABLE_ROLES, TEST_ACCOUNTS, type TestAccount } from './test-accounts';

/**
 * The combined build: one sign-in for every role, then exactly one product
 * app mounted at a time, chosen by the signed-in role.
 *
 * Only one route tree is ever live, so each app's absolute routes
 * (`/parent/children`, `/review-queue`, `/school/students`) behave exactly as
 * they do when that app runs on its own. Staff can switch roles from their
 * account menu (it signs out and back in as that role's test account);
 * parents and students cannot.
 */
const APPS = {
  family: FamilyApp,
  school: SchoolApp,
  admin: AdminApp,
} as const;

function FullScreenLoading({ label }: { label: string }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center">
      <DawnBackdrop />
      <LoadingState label={label} />
    </div>
  );
}

export function DevShell() {
  const { user, isRestoring, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [switchingTo, setSwitchingTo] = useState<TestAccount | null>(null);
  const [switchError, setSwitchError] = useState<string>();

  if (isRestoring) return <FullScreenLoading label="Starting up" />;
  if (!user && switchingTo) return <FullScreenLoading label={`Opening the ${ROLE_LABELS[switchingTo.role]} view`} />;

  if (!user) {
    return (
      <Routes>
        <Route path="/sign-in" element={<SignInScreen {...(switchError ? { notice: switchError } : {})} />} />
        <Route path="*" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    );
  }

  // Signed in already: the shared sign-in has nothing to offer, so go home.
  if (pathname === '/sign-in') return <Navigate to={ROLE_HOME_PATH[user.role]} replace />;

  const switchTo = async (accountId: string) => {
    const account = TEST_ACCOUNTS.find((candidate) => candidate.role === accountId);
    if (!account) return;
    setSwitchError(undefined);
    setSwitchingTo(account);
    // A clean hand-over: this session ends on the server, and nothing cached carries across.
    signOut();
    try {
      const next = await signIn(account.credentials);
      navigate(ROLE_HOME_PATH[next.role], { replace: true });
    } catch {
      setSwitchError(`We could not open the ${ROLE_LABELS[account.role]} view. Sign in to carry on.`);
      navigate('/sign-in', { replace: true });
    } finally {
      setSwitchingTo(null);
    }
  };

  const canSwitch = SWITCHABLE_ROLES.includes(user.role);
  const roleSwitch: AccountSwitchState = {
    title: 'Switch role',
    accounts: canSwitch
      ? TEST_ACCOUNTS.filter((account) => SWITCHABLE_ROLES.includes(account.role)).map((account) => ({
          id: account.role,
          label: ROLE_LABELS[account.role],
          detail: account.person,
          icon: ROLE_ICONS[account.role],
        }))
      : [],
    currentId: user.role,
    switchTo: (accountId) => void switchTo(accountId),
  };

  const ActiveApp = APPS[ROLE_APP[user.role]];

  return (
    <AccountSwitchProvider value={roleSwitch}>
      <ActiveApp />
    </AccountSwitchProvider>
  );
}
