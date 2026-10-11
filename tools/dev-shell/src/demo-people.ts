import { DEMO_PASSWORD, DEMO_PIN, type Credentials, type Role } from '@evolveiq/api-client';

export interface DemoPerson {
  role: Role;
  name: string;
  credentials: Credentials;
  /** What this role actually gets to do, in their own terms. */
  summary: string;
}

/**
 * The demo accounts. They exist in the in-memory mock, and in a development
 * backend filled by `npm run db:seed-demo` in evolveiq-backend — the same
 * people, with the same password and PIN.
 */
export const DEMO_PEOPLE: DemoPerson[] = [
  {
    role: 'parent',
    name: 'Priya Ahluwalia',
    credentials: { email: 'priya@family.test', password: DEMO_PASSWORD },
    summary: 'Two children, each with this month’s summary, growth areas and activities to follow.',
  },
  {
    role: 'student',
    name: 'Maya Ahluwalia',
    credentials: { studentId: 'RV-1001', pin: DEMO_PIN },
    summary: 'Missions to do, a streak going, and the activity player.',
  },
  {
    role: 'teacher',
    name: 'Sunita Rao',
    credentials: { email: 'rao@school.test', password: DEMO_PASSWORD },
    summary: 'Five students across 4B and 3A, with their growth areas, activities and her own observations.',
  },
  {
    role: 'psychologist',
    name: 'Dr. Anand Mehta',
    credentials: { email: 'mehta@school.test', password: DEMO_PASSWORD },
    summary: 'The review queue across both schools, three of it Significant, plus the activity library.',
  },
  {
    role: 'school_admin',
    name: 'Clara Fernandes',
    credentials: { email: 'clara@school.test', password: DEMO_PASSWORD },
    summary: 'Students, teachers, classes and parents at Ridgeview Primary.',
  },
  {
    role: 'platform_admin',
    name: 'Tunde Oyelaran',
    credentials: { email: 'tunde@evolveiq.test', password: DEMO_PASSWORD },
    summary: 'Two schools and every account across all six roles.',
  },
];

export const APP_GROUPS = [
  {
    id: 'family' as const,
    name: 'Family web app',
    note: 'Runs on its own at port 5173.',
  },
  {
    id: 'school' as const,
    name: 'School web app',
    note: 'Runs on its own at port 5174.',
  },
  {
    id: 'admin' as const,
    name: 'Admin panel',
    note: 'Runs on its own at port 5175.',
  },
];
