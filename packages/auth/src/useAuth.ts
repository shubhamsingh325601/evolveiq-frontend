import { useContext } from 'react';
import { AuthContext, type AuthState } from './auth-context';

/** The only place `useContext(AuthContext)` is called. */
export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
