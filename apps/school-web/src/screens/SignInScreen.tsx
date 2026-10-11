import { DEMO_PASSWORD } from '@evolveiq/api-client';
import { useSignInForApp } from '@evolveiq/auth';
import { SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signInToApp, error, isSigningIn } = useSignInForApp('school');

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For teachers and school psychologists."
      showcase={{
        body: 'Devan left the room without asking when the fire drill alarm sounded, and needed about fifteen minutes before he could come back in.',
        attribution: 'Sunita Rao, class 4B',
      }}
      demoAccounts={[
        { label: 'Sunita Rao, teacher of 4B and 3A', credentials: { email: 'rao@school.test', password: DEMO_PASSWORD } },
        { label: 'Dr. Anand Mehta, psychologist', credentials: { email: 'mehta@school.test', password: DEMO_PASSWORD } },
        { label: 'Ritu Kapoor, teacher of 5C', credentials: { email: 'ritu@school.test', password: DEMO_PASSWORD } },
      ]}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
