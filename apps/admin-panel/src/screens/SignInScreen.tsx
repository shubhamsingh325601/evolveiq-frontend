import { DEMO_PASSWORD } from '@evolveiq/api-client';
import { useSignInForApp } from '@evolveiq/auth';
import { SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signInToApp, error, isSigningIn } = useSignInForApp('admin');

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For school administrators and the platform team."
      showcase={{
        body: 'Tara packed her own bag and checked the timetable herself for three days running, with no reminder from me.',
        attribution: 'Ritu Kapoor, class 5C',
      }}
      demoAccounts={[
        { label: 'Clara Fernandes, school admin', credentials: { email: 'clara@school.test', password: DEMO_PASSWORD } },
        { label: 'Tunde Oyelaran, platform admin', credentials: { email: 'tunde@evolveiq.test', password: DEMO_PASSWORD } },
      ]}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
