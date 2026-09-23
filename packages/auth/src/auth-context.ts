import { createContext } from 'react';
import type { Role, User } from '@evolveiq/api-client';

export interface AuthState {
  user: User | null;
  role: Role | undefined;
  isRestoring: boolean;
  signIn: (email: string) => Promise<User>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthState | null>(null);
