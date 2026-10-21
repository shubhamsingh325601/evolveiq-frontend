import { DEMO_PASSWORD } from '@evolveiq/api-client';
import { ROLE_LABELS, useSignInForApp } from '@evolveiq/auth';
import { ROLE_ICONS, SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signInToApp, error, isSigningIn } = useSignInForApp('admin');

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For school administrators and the platform team."
      showcase={{
        body: 'Tara packed her own bag and checked the timetable herself for three days running, with no reminder from me.',
        attribution: 'Ritu Kapoor, class 5C — a star for Tara',
      }}
      demoAccounts={[
        {
          role: ROLE_LABELS.school_admin,
          person: 'Clara Fernandes, Ridgeview Primary',
          icon: ROLE_ICONS.school_admin,
          credentials: { email: 'clara@school.test', password: DEMO_PASSWORD },
        },
        {
          role: ROLE_LABELS.platform_admin,
          person: 'Tunde Oyelaran, every school',
          icon: ROLE_ICONS.platform_admin,
          credentials: { email: 'tunde@evolveiq.test', password: DEMO_PASSWORD },
        },
      ]}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
