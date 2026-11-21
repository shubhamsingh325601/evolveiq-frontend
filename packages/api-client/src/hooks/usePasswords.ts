import { useMutation } from '@tanstack/react-query';
import { ENDPOINTS } from '../endpoints';
import { request } from '../http-client';

/**
 * Forgot password, step 1 (adults): a 6-digit code goes to the email, if it
 * belongs to an account. The answer is the same either way, so the screen
 * never tells anyone whether an address is registered.
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) =>
      request<{ message: string }>('POST', ENDPOINTS.auth.forgotPassword, { body: { email }, isAnonymous: true }),
  });
}

/**
 * Forgot password, step 2: the code from the email and the new password. A
 * wrong, used or expired code answers 400 `INVALID_RESET_CODE`. Every session
 * of the account ends; the screen signs in afresh with the new password.
 */
export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { email: string; code: string; newPassword: string }) =>
      request<void>('POST', ENDPOINTS.auth.resetPassword, { body: input, isAnonymous: true }),
  });
}

/** What an admin sets for someone who forgot theirs: adults a password, students a PIN. */
export type NewSecret = { password: string } | { pin: string };

/**
 * An admin sets a new password or PIN for someone they manage. The person's
 * sessions end and any lockout is cleared; nothing is emailed.
 */
export function useSetUserPassword() {
  return useMutation({
    mutationFn: ({ userId, secret }: { userId: string; secret: NewSecret }) =>
      request<void>('POST', ENDPOINTS.users.setPassword(userId), { body: secret }),
  });
}

/** A parent sets a new PIN for their own child who forgot it. */
export function useSetChildPin() {
  return useMutation({
    mutationFn: ({ studentId, pin }: { studentId: string; pin: string }) =>
      request<void>('POST', ENDPOINTS.family.childPin(studentId), { body: { pin } }),
  });
}
