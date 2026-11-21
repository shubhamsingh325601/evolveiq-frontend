import { createContext } from 'react';
import type { Credentials, Role, SessionUser } from '@evolveiq/api-client';

export interface AuthState {
  user: SessionUser | null;
  role: Role | undefined;
  isRestoring: boolean;
  /** Adults: email and password. Students: student ID and PIN. */
  signIn: (credentials: Credentials) => Promise<SessionUser>;
  signOut: () => void;
  /**
   * Adults change their own password. This device stays signed in; every
   * other session ends. Rejects with the API error (e.g. a wrong current one).
   */
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);
