import { DEMO_PASSWORD, DEMO_PIN } from '@evolveiq/api-client';
import { ROLE_LABELS, useSignInForApp } from '@evolveiq/auth';
import { ROLE_ICONS, SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signInToApp, error, isSigningIn } = useSignInForApp('family');

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For parents and their children."
      allowsStudents
      showcase={{
        body: 'Maya stayed with the tangram puzzle for almost ten minutes without being prompted, which is the longest she has worked on one thing this term.',
        attribution: 'Sunita Rao, her teacher — a star for Maya',
      }}
      demoAccounts={[
        {
          role: ROLE_LABELS.parent,
          person: 'Priya Ahluwalia, two children',
          icon: ROLE_ICONS.parent,
          credentials: { email: 'priya@family.test', password: DEMO_PASSWORD },
        },
        {
          role: ROLE_LABELS.student,
          person: 'Maya Ahluwalia',
          icon: ROLE_ICONS.student,
          credentials: { studentId: 'RV-1001', pin: DEMO_PIN },
        },
        {
          role: ROLE_LABELS.parent,
          person: 'Neil D’Souza, one child',
          icon: ROLE_ICONS.parent,
          credentials: { email: 'neil@family.test', password: DEMO_PASSWORD },
        },
      ]}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
