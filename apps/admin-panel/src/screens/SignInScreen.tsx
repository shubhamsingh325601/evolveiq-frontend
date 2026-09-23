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
      audienceLine="For school administrators and the platform team."
      showcase={{
        body: 'Tara packed her own bag and checked the timetable herself for three days running, with no reminder from me.',
        attribution: 'Ritu Kapoor, class 5C, 17 September',
      }}
      demoAccounts={[
        { label: 'Clara Fernandes, school admin', email: 'clara@school.test' },
        { label: 'Tunde Oyelaran, platform admin', email: 'tunde@evolveiq.test' },
      ]}
      onSignIn={handleSignIn}
      isSigningIn={isSigningIn}
      {...(error ? { error } : {})}
    />
  );
}
