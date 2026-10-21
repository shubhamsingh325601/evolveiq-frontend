import { DEMO_PASSWORD } from '@evolveiq/api-client';
import { ROLE_LABELS, useSignInForApp } from '@evolveiq/auth';
import { ROLE_ICONS, SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signInToApp, error, isSigningIn } = useSignInForApp('school');

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For teachers and school counsellors."
      showcase={{
        body: 'Noor noticed a classmate sitting alone at lunch, invited her to join the table and introduced her to everyone.',
        attribution: 'Sunita Rao, class 3A — a star for Noor',
      }}
      demoAccounts={[
        {
          role: ROLE_LABELS.teacher,
          person: 'Sunita Rao, 4B and 3A',
          icon: ROLE_ICONS.teacher,
          credentials: { email: 'rao@school.test', password: DEMO_PASSWORD },
        },
        {
          role: ROLE_LABELS.psychologist,
          person: 'Dr. Anand Mehta',
          icon: ROLE_ICONS.psychologist,
          credentials: { email: 'mehta@school.test', password: DEMO_PASSWORD },
        },
        {
          role: ROLE_LABELS.teacher,
          person: 'Ritu Kapoor, 5C',
          icon: ROLE_ICONS.teacher,
          credentials: { email: 'ritu@school.test', password: DEMO_PASSWORD },
        },
      ]}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
