import { ROLE_LABELS, useSignInForApp } from '@evolveiq/auth';
import { ROLE_ICONS, SignInLayout } from '@evolveiq/domain';
import { TEST_ACCOUNTS } from './test-accounts';

export interface SignInScreenProps {
  /** Shown in the form's error line, such as a role switch that did not go through. */
  notice?: string;
}

/**
 * The one sign-in for every role. EvolvIQ works out which app to open from
 * the account, so a parent, a student, a teacher, a counsellor and an admin
 * all start here. The test accounts are always offered: this build exists
 * for walking through the product.
 */
export function SignInScreen({ notice }: SignInScreenProps) {
  const { signInToApp, error, isSigningIn } = useSignInForApp();
  const message = error ?? notice;

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="Parents, students and school staff all sign in here."
      allowsStudents
      adultTabLabel="Parent or staff"
      isShowingDemoAccounts
      showcase={{
        body: 'Arjun told the class about the museum trip with a clear beginning, middle and end, and answered three questions without his notes.',
        attribution: 'Sunita Rao, his teacher — a star for Arjun',
      }}
      demoAccounts={TEST_ACCOUNTS.map((account) => ({
        role: ROLE_LABELS[account.role],
        person: account.person,
        icon: ROLE_ICONS[account.role],
        credentials: account.credentials,
      }))}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(message ? { error: message } : {})}
    />
  );
}
