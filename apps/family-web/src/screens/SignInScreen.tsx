import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROLE_HOME_PATH, useAuth } from '@evolveiq/auth';
import { SignInLayout } from '@evolveiq/domain';

export function SignInScreen() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async (email: string) => {
    setIsSigningIn(true);
    setError(undefined);
    try {
      const user = await signIn(email);
      navigate(ROLE_HOME_PATH[user.role], { replace: true });
    } catch {
      setError('We could not find an account with that email address.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SignInLayout
      appName="EvolvIQ"
      audienceLine="For parents and their children."
      showcase={{
        body: 'Maya stayed with the tangram puzzle for almost ten minutes without being prompted, which is the longest she has worked on one thing this term.',
        attribution: 'Sunita Rao, her teacher, 18 September',
      }}
      demoAccounts={[
        { label: 'Priya Ahluwalia, parent of two', email: 'priya@family.test' },
        { label: 'Maya Ahluwalia, student', email: 'maya@family.test' },
        { label: 'Neil D\u2019Souza, parent', email: 'neil@family.test' },
      ]}
      onSignIn={handleSignIn}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
