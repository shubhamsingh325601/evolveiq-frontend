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
      audienceLine="For teachers and school psychologists."
      showcase={{
        body: 'Devan left the room without asking when the fire drill alarm sounded, and needed about fifteen minutes before he could come back in.',
        attribution: 'Sunita Rao, class 4B, 21 September',
      }}
      demoAccounts={[
        { label: 'Sunita Rao, teacher of 4B and 3A', email: 'rao@school.test' },
        { label: 'Dr. Anand Mehta, psychologist', email: 'mehta@school.test' },
        { label: 'Ritu Kapoor, teacher of 5C', email: 'ritu@school.test' },
      ]}
      onSignIn={handleSignIn}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
