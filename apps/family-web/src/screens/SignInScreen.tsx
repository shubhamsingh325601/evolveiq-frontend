import { DEMO_PASSWORD, DEMO_PIN } from '@evolveiq/api-client';
import { useSignInForApp } from '@evolveiq/auth';
import { SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signInToApp, error, isSigningIn } = useSignInForApp('family');

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For parents and their children."
      allowsStudents
      showcase={{
        body: 'Maya stayed with the tangram puzzle for almost ten minutes without being prompted, which is the longest she has worked on one thing this term.',
        attribution: 'Sunita Rao, her teacher',
      }}
      demoAccounts={[
        { label: 'Priya Ahluwalia, parent of two', credentials: { email: 'priya@family.test', password: DEMO_PASSWORD } },
        { label: 'Maya Ahluwalia, student', credentials: { studentId: 'RV-1001', pin: DEMO_PIN } },
        { label: 'Neil D’Souza, parent', credentials: { email: 'neil@family.test', password: DEMO_PASSWORD } },
      ]}
      onSignIn={signInToApp}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
