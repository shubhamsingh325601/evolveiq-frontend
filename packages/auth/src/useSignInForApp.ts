import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isApiError, type Credentials } from '@evolveiq/api-client';
import { APP_LABELS, ROLE_APP, ROLE_HOME_PATH } from './role-access';
import { useAuth } from './useAuth';

type App = keyof typeof APP_LABELS;

/** What went wrong, in words a parent, a child or a teacher can act on. */
export function signInErrorMessage(error: unknown, credentials: Credentials): string {
  const isStudent = 'studentId' in credentials;
  if (isApiError(error)) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return isStudent
        ? 'That student ID and PIN do not match. Check them and try again.'
        : 'That email address and password do not match an account.';
    }
    if (error.code === 'ACCOUNT_DISABLED') return 'This account has been switched off. Ask your school to turn it back on.';
    if (error.code === 'VALIDATION_ERROR') return 'Fill in both boxes to sign in.';
    return 'Something went wrong on our side. Try again in a moment.';
  }
  return 'We could not reach EvolvIQ. Check your connection and try again.';
}

/**
 * Signs someone in to one of the three apps and takes them to their home
 * screen. An account that belongs to another app is signed straight back out
 * and told which app to use, instead of being dropped on a page that does not
 * exist here.
 */
export function useSignInForApp(app: App) {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const signInToApp = async (credentials: Credentials) => {
    setIsSigningIn(true);
    setError(undefined);
    try {
      const user = await signIn(credentials);
      const home = ROLE_APP[user.role];
      if (home !== app) {
        signOut();
        setError(`This account is for ${APP_LABELS[home]}. Sign in there instead.`);
        return;
      }
      navigate(ROLE_HOME_PATH[user.role], { replace: true });
    } catch (caught) {
      setError(signInErrorMessage(caught, credentials));
    } finally {
      setIsSigningIn(false);
    }
  };

  return { signInToApp, error, isSigningIn };
}
