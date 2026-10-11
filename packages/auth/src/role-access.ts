import type { Role } from '@evolveiq/api-client';

/**
 * The single place that encodes "who can see what" (see ARCHITECTURE.md).
 * New roles or permission changes are made here, never inside a screen.
 */

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  parent: 'Parent',
  teacher: 'Teacher',
  psychologist: 'Psychologist',
  school_admin: 'School admin',
  platform_admin: 'Platform admin',
};

/** Where each role lands after signing in. */
export const ROLE_HOME_PATH: Record<Role, string> = {
  student: '/student/today',
  parent: '/parent/children',
  teacher: '/teacher/students',
  psychologist: '/review-queue',
  school_admin: '/school/students',
  platform_admin: '/platform/schools',
};

/** Which app serves which role — used to explain a wrong-app sign-in. */
export const ROLE_APP: Record<Role, 'family' | 'school' | 'admin'> = {
  student: 'family',
  parent: 'family',
  teacher: 'school',
  psychologist: 'school',
  school_admin: 'admin',
  platform_admin: 'admin',
};

export const APP_LABELS: Record<'family' | 'school' | 'admin', string> = {
  family: 'the family app',
  school: 'the school app',
  admin: 'the admin panel',
};

export function isRoleAllowed(role: Role | undefined, allowed: Role[]): boolean {
  return role !== undefined && allowed.includes(role);
}
