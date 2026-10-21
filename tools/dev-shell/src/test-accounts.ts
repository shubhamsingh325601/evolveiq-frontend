import { DEMO_PASSWORD, DEMO_PIN, type Credentials, type Role } from '@evolveiq/api-client';

export interface TestAccount {
  role: Role;
  /** Who that is in the demo, and what they have to look at. */
  person: string;
  credentials: Credentials;
}

/**
 * One test account per role, named for the role it opens (client feedback,
 * 21 Oct 2026: "Parent, Teacher, Counsellor, Admin"). They exist in the
 * in-memory demo, and in a backend filled by `npm run db:seed-demo` in
 * evolveiq-backend — the same people, with the same password and PIN.
 */
export const TEST_ACCOUNTS: TestAccount[] = [
  {
    role: 'parent',
    person: 'Priya Ahluwalia, two children',
    credentials: { email: 'priya@family.test', password: DEMO_PASSWORD },
  },
  {
    role: 'student',
    person: 'Maya Ahluwalia',
    credentials: { studentId: 'RV-1001', pin: DEMO_PIN },
  },
  {
    role: 'teacher',
    person: 'Sunita Rao, 4B and 3A',
    credentials: { email: 'rao@school.test', password: DEMO_PASSWORD },
  },
  {
    role: 'psychologist',
    person: 'Dr. Anand Mehta',
    credentials: { email: 'mehta@school.test', password: DEMO_PASSWORD },
  },
  {
    role: 'school_admin',
    person: 'Clara Fernandes, Ridgeview Primary',
    credentials: { email: 'clara@school.test', password: DEMO_PASSWORD },
  },
  {
    role: 'platform_admin',
    person: 'Tunde Oyelaran, every school',
    credentials: { email: 'tunde@evolveiq.test', password: DEMO_PASSWORD },
  },
];

/**
 * The roles that may switch between each other from the account menu: the
 * school's staff. Parents and students never switch roles — a parent moves
 * between their children instead, and anyone can sign out to use another
 * account.
 */
export const SWITCHABLE_ROLES: Role[] = ['teacher', 'psychologist', 'school_admin', 'platform_admin'];
