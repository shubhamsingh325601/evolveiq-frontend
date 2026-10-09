import type { Role } from '@evolveiq/api-client';

export interface DemoPerson {
  role: Role;
  name: string;
  email: string;
  /** What this role actually gets to do, in their own terms. */
  summary: string;
}

/** Mirrors the seed accounts in `packages/api-client/src/mock/fixtures.ts`. */
export const DEMO_PEOPLE: DemoPerson[] = [
  {
    role: 'parent',
    name: 'Priya Ahluwalia',
    email: 'priya@family.test',
    summary: 'Two children, each with an EvolvIQ Holistic Index, a report, teacher notes and a monthly summary.',
  },
  {
    role: 'student',
    name: 'Maya Ahluwalia',
    email: 'maya@family.test',
    summary: 'Level 4, two missions waiting, a finished one, and her own Holistic Report.',
  },
  {
    role: 'teacher',
    name: 'Sunita Rao',
    email: 'rao@school.test',
    summary: 'Five students across 4B and 3A, with their EHI and full observation history.',
  },
  {
    role: 'psychologist',
    name: 'Dr. Anand Mehta',
    email: 'mehta@school.test',
    summary: 'Six observations pending, three flagged significant, plus the activity library.',
  },
  {
    role: 'school-admin',
    name: 'Clara Fernandes',
    email: 'clara@school.test',
    summary: 'Students, teachers, classes and parents at Ridgeview Primary.',
  },
  {
    role: 'platform-admin',
    name: 'Tunde Oyelaran',
    email: 'tunde@evolveiq.test',
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
