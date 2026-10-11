import { createContext } from 'react';
import type { Credentials, Role, SessionUser } from '@evolveiq/api-client';

export interface AuthState {
  user: SessionUser | null;
  role: Role | undefined;
  isRestoring: boolean;
  /** Adults: email and password. Students: student ID and PIN. */
  signIn: (credentials: Credentials) => Promise<SessionUser>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);
