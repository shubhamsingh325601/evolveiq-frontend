import { ENDPOINTS } from './endpoints';
import { request } from './http-client';
import type { SessionUser } from './types';

/** Adults sign in with an email and password; students with their student ID and PIN. */
export type Credentials = { email: string; password: string } | { studentId: string; pin: string };

export interface TokenPair {
  accessToken: string;
  tokenType: 'Bearer';
  /** Access-token lifetime, in seconds. */
  expiresIn: number;
  /** Rotated on every refresh: the one sent is spent, the one returned replaces it. */
  refreshToken: string;
  refreshExpiresIn: number;
}

export interface SignInResult extends TokenPair {
  user: SessionUser;
}

/** One endpoint for all six roles; the role comes back with the user. */
export function signInRequest(credentials: Credentials): Promise<SignInResult> {
  return request<SignInResult>('POST', ENDPOINTS.auth.login, { body: credentials, isAnonymous: true });
}

export function refreshRequest(refreshToken: string): Promise<TokenPair> {
  return request<TokenPair>('POST', ENDPOINTS.auth.refresh, { body: { refreshToken }, isAnonymous: true });
}

/** Ends this session on the server: its refresh token, and every one rotated from it, stop working. */
export function signOutRequest(refreshToken: string): Promise<void> {
  return request<void>('POST', ENDPOINTS.auth.logout, { body: { refreshToken } });
}
