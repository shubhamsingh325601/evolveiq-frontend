import { isApiError } from '@evolveiq/api-client';
import type { RecordEditorField } from './RecordEditor';

/**
 * The account rules the backend enforces, checked in the dialog first so a
 * mistake is caught beside the field rather than after a round trip.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateEmail = (value: string) => (EMAIL.test(value) ? undefined : 'Enter a full email address');
export const validatePassword = (value: string) =>
  value.length >= 10 && value.length <= 128 ? undefined : 'Use 10 to 128 characters';
export const validateStudentId = (value: string) =>
  /^[A-Za-z0-9-]{3,32}$/.test(value) ? undefined : 'Use 3 to 32 letters, digits or hyphens';
export const validatePin = (value: string) => (/^[0-9]{6}$/.test(value) ? undefined : 'Use exactly 6 digits');

export const FULL_NAME_FIELD: RecordEditorField = {
  name: 'fullName',
  label: 'Full name',
  isRequired: true,
  maxLength: 100,
};

export const EMAIL_FIELD: RecordEditorField = {
  name: 'email',
  label: 'Email address',
  type: 'email',
  isRequired: true,
  validate: validateEmail,
  autoComplete: 'off',
};

export const PASSWORD_FIELD: RecordEditorField = {
  name: 'password',
  label: 'Password',
  type: 'password',
  isRequired: true,
  hint: 'At least 10 characters. Share it with them safely; there is no password reset yet.',
  validate: validatePassword,
  autoComplete: 'new-password',
};

export const STUDENT_ID_FIELD: RecordEditorField = {
  name: 'studentId',
  label: 'Student ID',
  isRequired: true,
  hint: 'What the student signs in with. Unique across EvolvIQ, e.g. RV-1042.',
  validate: validateStudentId,
  maxLength: 32,
  autoComplete: 'off',
};

export const PIN_FIELD: RecordEditorField = {
  name: 'pin',
  label: 'PIN',
  type: 'password',
  inputMode: 'numeric',
  isRequired: true,
  hint: 'Six digits, for the student to sign in with.',
  validate: validatePin,
  maxLength: 6,
  autoComplete: 'new-password',
};

/** What went wrong saving an account or record, in words an admin can act on. */
export function saveErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return 'We could not reach EvolvIQ. Check your connection and try again.';
  if (error.code === 'DUPLICATE_ACCOUNT') {
    const field = !Array.isArray(error.details) ? error.details?.field : undefined;
    return field === 'studentId'
      ? 'That student ID is already in use. Choose another.'
      : 'That email address is already in use. Choose another.';
  }
  if (error.code === 'VALIDATION_ERROR' && error.fieldIssues.length > 0) {
    return error.fieldIssues.map((issue) => `${issue.field} ${issue.message}`).join('. ');
  }
  if (error.status === 403 || error.status === 409 || error.status === 422) return error.message;
  return fallback;
}
