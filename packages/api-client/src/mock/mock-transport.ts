import { addMonths, businessDate, businessMonth, currentStreak, longestRun } from '../business-time';
import type { HttpMethod, RequestOptions, TransportResponse } from '../http-client';
import type {
  ActivityAnswer,
  ActivityContent,
  ActivityType,
  DevelopmentArea,
  FieldIssue,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
  ObservationTone,
  ObservationWhen,
  LearningBehaviourArea,
  Pagination,
  Role,
} from '../types';
import {
  buildSeed,
  DEMO_PASSWORD,
  DEMO_PIN,
  type MockActivity,
  type MockAssignment,
  type MockObservation,
  type MockState,
  type MockUser,
} from './fixtures';

export { DEMO_PASSWORD, DEMO_PIN };

/**
 * An in-memory stand-in for the backend, used while `VITE_API_BASE_URL` is
 * unset: the demo, and every app-level test.
 *
 * It answers the same paths with the same shapes, roles and rules as
 * evolveiq-backend — who may call what (403), whose records they reach (404),
 * one review per observation (409), parents never seeing clinical fields — so
 * a screen that works here works against the real API. Writes last until the
 * tab reloads or a test calls `resetMockStore()`.
 */

let state: MockState = buildSeed();
let idCounter = 0;
/** Refresh tokens spent by rotation or logout. Anything else well-formed is accepted. */
const revokedRefreshTokens = new Set<string>();
/** Sessions (refresh-token families) ended by logout or deactivation. */
const endedFamilies = new Set<string>();

/** Tests reset between cases so one case cannot leak state into the next. */
export function resetMockStore(): void {
  state = buildSeed();
  idCounter = 0;
  revokedRefreshTokens.clear();
  endedFamilies.clear();
}

const LATENCY_MS = 180;

function delay(): Promise<void> {
  // Tests run without artificial latency; the browser gets enough to show
  // real loading states rather than a flash of content.
  const ms = import.meta.env?.MODE === 'test' ? 0 : LATENCY_MS;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

const nowIso = () => new Date().toISOString();

// ───────────────────────────── Errors ─────────────────────────────

class MockHttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: FieldIssue[] | Record<string, unknown>,
  ) {
    super(message);
  }
}

const Errors = {
  validation: (details: FieldIssue[], message = 'Request validation failed.') =>
    new MockHttpError(400, 'VALIDATION_ERROR', message, details),
  unauthenticated: () => new MockHttpError(401, 'UNAUTHENTICATED', 'Authentication required.'),
  invalidCredentials: () => new MockHttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials.'),
  invalidRefreshToken: () =>
    new MockHttpError(401, 'INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token.'),
  accountDisabled: () => new MockHttpError(403, 'ACCOUNT_DISABLED', 'This account has been deactivated.'),
  forbidden: (message = 'You are not allowed to perform this action.') =>
    new MockHttpError(403, 'FORBIDDEN', message),
  notFound: (resource: string) => new MockHttpError(404, 'NOT_FOUND', `${resource} not found.`),
  duplicate: (field: string) =>
    new MockHttpError(409, 'DUPLICATE_ACCOUNT', 'An account with this identifier already exists.', { field }),
  conflict: (message: string) => new MockHttpError(409, 'CONFLICT', message),
  invalidReference: (field: string, message: string) =>
    new MockHttpError(422, 'INVALID_REFERENCE', message, { field }),
};

// ───────────────────────────── Value lists ─────────────────────────────

const ROLES: Role[] = ['student', 'parent', 'teacher', 'psychologist', 'school_admin', 'platform_admin'];
const TONES: ObservationTone[] = ['positive', 'concern'];
const AREAS: ObservationArea[] =['emotions', 'behaviour', 'social', 'learning', 'communication', 'physical', 'routines', 'other'];
const WHENS: ObservationWhen[] = ['today', 'this_week', 'this_month', 'over_a_month'];
const FREQUENCIES: ObservationFrequency[] = ['once', 'sometimes', 'often', 'daily'];
const LEVELS: ObservationLevel[] = ['minor', 'moderate', 'significant'];
const LEARNING_BEHAVIOUR_AREAS: LearningBehaviourArea[] = [
  'attention',
  'participation',
  'following_instructions',
  'task_completion',
  'organisation',
  'working_with_others',
  'self_control',
  'other',
];
const ACTIVITY_TYPES: ActivityType[] = ['mcq', 'text', 'image_pick', 'rating', 'media_response'];

/** Growth areas are named with these labels, exactly as the backend names them. */
const DEVELOPMENT_AREA_NAMES: Record<DevelopmentArea, string> = {
  managing_feelings: 'Managing feelings',
  social_skills: 'Friendships & social skills',
  communication: 'Communication',
  focus_attention: 'Focus & attention',
  self_control: 'Self-control',
  confidence: 'Confidence & self-esteem',
  resilience: 'Coping & resilience',
  independence: 'Independence & routines',
  learning_skills: 'Learning skills',
  motor_skills: 'Movement & coordination',
};
const DEVELOPMENT_AREAS = Object.keys(DEVELOPMENT_AREA_NAMES) as DevelopmentArea[];

const MAX_GROWTH_AREAS = 5;
const HISTORY_SIZE = 20;

// ───────────────────────────── Request context ─────────────────────────────

type Body = Record<string, unknown>;
type Query = Record<string, string>;

interface Context {
  actor: MockUser;
  query: Query;
  body: Body;
}

interface Result {
  status?: number;
  body?: unknown;
}

function field(issues: FieldIssue[], name: string, message: string): void {
  issues.push({ field: name, message });
}

function text(body: Body, name: string, issues: FieldIssue[], { max = 200, isOptional = false } = {}): string | undefined {
  const value = body[name];
  if (value === undefined && isOptional) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    field(issues, name, 'is required');
    return undefined;
  }
  if (value.length > max) field(issues, name, `must be at most ${max} characters`);
  return value.trim();
}

function oneOf<T extends string>(body: Body, name: string, values: readonly T[], issues: FieldIssue[], isOptional = false): T | undefined {
  const value = body[name];
  if (value === undefined && isOptional) return undefined;
  if (typeof value !== 'string' || !values.includes(value as T)) {
    field(issues, name, `must be one of: ${values.join(', ')}`);
    return undefined;
  }
  return value as T;
}

function rejectUnknown(body: Body, allowed: string[], issues: FieldIssue[]): void {
  for (const key of Object.keys(body)) {
    if (!allowed.includes(key)) field(issues, key, 'is not allowed');
  }
}

function assertValid(issues: FieldIssue[]): void {
  if (issues.length > 0) throw Errors.validation(issues);
}

function paginate<T, K extends string>(items: T[], query: Query, key: K): Record<K, T[]> & { pagination: Pagination } {
  const page = Math.max(1, Number(query.page ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit ?? 20) || 20));
  const total = items.length;
  const totalPages = Math.ceil(total / limit);
  return {
    [key]: items.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPreviousPage: page > 1 },
  } as Record<K, T[]> & { pagination: Pagination };
}

const byName = (a: { fullName: string }, b: { fullName: string }) => a.fullName.localeCompare(b.fullName);
const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

// ───────────────────────────── Lookups and scopes ─────────────────────────────

function userById(id: string | null | undefined): MockUser | undefined {
  return state.users.find((candidate) => candidate.id === id);
}

function classOfStudent(studentId: string): string | undefined {
  return state.classStudents.find((row) => row.studentId === studentId)?.classId;
}

function teachesStudent(teacherId: string, studentId: string): boolean {
  const classId = classOfStudent(studentId);
  return classId !== undefined && state.classTeachers.some((row) => row.classId === classId && row.teacherId === teacherId);
}

function parentOf(studentId: string): string | undefined {
  return state.parentLinks.find((link) => link.studentId === studentId)?.parentId;
}

/** The one rule for which students a caller reaches (backend: users/student-scope.ts). */
function canReachStudent(actor: MockUser, student: MockUser): boolean {
  if (student.role !== 'student') return false;
  switch (actor.role) {
    case 'student':
      return actor.id === student.id;
    case 'parent':
      return parentOf(student.id) === actor.id;
    case 'teacher':
      return teachesStudent(actor.id, student.id);
    case 'school_admin':
      return actor.schoolId !== null && actor.schoolId === student.schoolId;
    case 'psychologist':
    case 'platform_admin':
      return true;
  }
}

function studentInScope(actor: MockUser, studentId: string): MockUser | undefined {
  const student = userById(studentId);
  return student && canReachStudent(actor, student) ? student : undefined;
}

/** Who may create, list and manage whom (backend: auth.policy.ts). */
function rolesManagedBy(role: Role): Role[] {
  if (role === 'platform_admin') return ROLES;
  if (role === 'school_admin') return ['student', 'parent', 'teacher'];
  return [];
}

function isWithinReach(actor: MockUser, user: MockUser): boolean {
  if (actor.role === 'platform_admin') return true;
  return actor.schoolId !== null && user.schoolId === actor.schoolId && rolesManagedBy(actor.role).includes(user.role);
}

// ───────────────────────────── Serialisers (one shape per audience) ─────────────────────────────

const person = (user: MockUser | undefined) => ({ id: user?.id ?? '', fullName: user?.fullName ?? 'Unknown' });

function toSessionUser(user: MockUser) {
  return { id: user.id, role: user.role, fullName: user.fullName, schoolId: user.schoolId };
}

function toUser(user: MockUser) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    studentId: user.studentLoginId,
    schoolId: user.schoolId,
    parentId: user.role === 'student' ? (parentOf(user.id) ?? null) : null,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function toParentObservation(o: MockObservation) {
  return {
    id: o.id,
    studentId: o.studentId,
    tone: o.tone,
    area: o.area,
    description: o.description,
    when: o.when,
    howOften: o.howOften,
    status: o.status,
    createdAt: o.createdAt,
  };
}

function toTeacherObservation(o: MockObservation) {
  return {
    ...toParentObservation(o),
    level: o.level,
    learningBehaviourArea: o.learningBehaviourArea,
    teacherOnlyNote: o.teacherOnlyNote,
    reviewedAt: o.reviewedAt,
  };
}

function toReviewObservation(o: MockObservation) {
  const isReviewed = o.status === 'reviewed' && o.reviewOutcome && o.reviewedAt;
  return {
    id: o.id,
    schoolId: o.schoolId,
    student: person(userById(o.studentId)),
    author: { ...person(userById(o.authorId)), role: o.authorRole },
    tone: o.tone,
    area: o.area,
    description: o.description,
    when: o.when,
    howOften: o.howOften,
    level: o.level,
    learningBehaviourArea: o.learningBehaviourArea,
    status: o.status,
    review: isReviewed
      ? {
          outcome: o.reviewOutcome,
          developmentArea: o.developmentArea,
          teacherOnlyNote: o.teacherOnlyNote,
          reviewedBy: person(userById(o.reviewedById)),
          reviewedAt: o.reviewedAt,
          activityIds: state.assignments.filter((a) => a.observationId === o.id).map((a) => a.activityId),
        }
      : null,
    createdAt: o.createdAt,
  };
}

function toActivity(a: MockActivity) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    isArchived: a.archivedAt !== null,
    isAssigned: state.assignments.some((assignment) => assignment.activityId === a.id),
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

function completionOf(assignmentId: string) {
  return state.completions.find((completion) => completion.assignmentId === assignmentId);
}

function activityOf(assignment: MockAssignment): MockActivity {
  const activity = state.activities.find((candidate) => candidate.id === assignment.activityId);
  if (!activity) throw new Error(`mock: assignment ${assignment.id} has no activity`);
  return activity;
}

function toStaffAssignment(a: MockAssignment) {
  const activity = activityOf(a);
  const completion = completionOf(a.id);
  return {
    id: a.id,
    studentId: a.studentId,
    activity: { id: activity.id, title: activity.title, type: activity.content.type },
    source: a.source,
    assignedBy: person(userById(a.assignedById)),
    observationId: a.observationId,
    assignedAt: a.createdAt,
    completion: completion ? { answer: completion.answer, completedAt: completion.completedAt } : null,
  };
}

function toStudentAssignment(a: MockAssignment) {
  const activity = activityOf(a);
  const completion = completionOf(a.id);
  return {
    id: a.id,
    activity: { id: activity.id, title: activity.title, content: activity.content },
    assignedAt: a.createdAt,
    isDone: completion !== undefined,
    completion: completion ? { answer: completion.answer, completedAt: completion.completedAt } : null,
  };
}

function toFamilyAssignment(a: MockAssignment) {
  const completion = completionOf(a.id);
  return {
    id: a.id,
    title: activityOf(a).title,
    isDone: completion !== undefined,
    assignedAt: a.createdAt,
    completedAt: completion?.completedAt ?? null,
  };
}

// ───────────────────────────── Auth and sessions ─────────────────────────────
// Tokens describe their own user, so a session survives a page reload (the
// store does too, until the tab closes) without the mock keeping a table.

const ACCESS_PREFIX = 'mock-access';
const REFRESH_PREFIX = 'mock-refresh';

function issueTokens(user: MockUser, familyId = nextId('fam')) {
  return {
    accessToken: `${ACCESS_PREFIX}.${user.id}.${nextId('t')}`,
    tokenType: 'Bearer' as const,
    expiresIn: 3600,
    refreshToken: `${REFRESH_PREFIX}.${user.id}.${familyId}.${nextId('r')}`,
    refreshExpiresIn: 604800,
  };
}

function actorFrom(headers: Record<string, string>): MockUser | null {
  const match = /^Bearer (.+)$/.exec(headers.Authorization ?? '');
  if (!match) return null;
  const [prefix, userId] = (match[1] ?? '').split('.');
  if (prefix !== ACCESS_PREFIX) return null;
  const user = userById(userId);
  // Every request re-checks the account, so a deactivated person is out at once.
  return user && user.isActive ? user : null;
}

function parseRefreshToken(token: unknown) {
  if (typeof token !== 'string') return null;
  const [prefix, userId, familyId] = token.split('.');
  if (prefix !== REFRESH_PREFIX || !userId || !familyId) return null;
  return { userId, familyId };
}

function login(body: Body): Result {
  const isStudent = 'studentId' in body;
  const identifier = isStudent ? body.studentId : body.email;
  const secret = isStudent ? body.pin : body.password;
  if (typeof identifier !== 'string' || typeof secret !== 'string' || !identifier || !secret) {
    throw Errors.validation([], 'Provide either "email" and "password", or "studentId" and "pin".');
  }
  const user = state.users.find((candidate) =>
    isStudent
      ? candidate.studentLoginId?.toUpperCase() === identifier.trim().toUpperCase()
      : candidate.email?.toLowerCase() === identifier.trim().toLowerCase(),
  );
  if (!user || user.secret !== secret) throw Errors.invalidCredentials();
  if (!user.isActive) throw Errors.accountDisabled();
  return { body: { ...issueTokens(user), user: toSessionUser(user) } };
}

function refresh(body: Body): Result {
  const token = body.refreshToken;
  const parsed = parseRefreshToken(token);
  if (!parsed || revokedRefreshTokens.has(token as string) || endedFamilies.has(parsed.familyId)) {
    throw Errors.invalidRefreshToken();
  }
  const user = userById(parsed.userId);
  if (!user) throw Errors.invalidRefreshToken();
  if (!user.isActive) throw Errors.accountDisabled();
  revokedRefreshTokens.add(token as string);
  return { body: issueTokens(user, parsed.familyId) };
}

function logout(actor: MockUser, body: Body): Result {
  const parsed = parseRefreshToken(body.refreshToken);
  if (!parsed || parsed.userId !== actor.id) throw Errors.invalidRefreshToken();
  endedFamilies.add(parsed.familyId);
  return { status: 204 };
}

function register({ actor, body }: Context): Result {
  const issues: FieldIssue[] = [];
  const role = oneOf(body, 'role', ROLES, issues);
  assertValid(issues);
  if (!role) throw Errors.validation(issues);
  if (!rolesManagedBy(actor.role).includes(role)) {
    throw Errors.forbidden(`Your role cannot create ${role} accounts.`);
  }

  const isStudent = role === 'student';
  const isSchoolScoped = role !== 'psychologist' && role !== 'platform_admin';
  const allowed = ['role', 'fullName', ...(isStudent ? ['studentId', 'pin', 'parentId'] : ['email', 'password'])];
  if (isSchoolScoped) allowed.push('schoolId');
  rejectUnknown(body, allowed, issues);

  const fullName = text(body, 'fullName', issues, { max: 100 });
  let email: string | null = null;
  let studentLoginId: string | null = null;
  let secret = '';
  if (isStudent) {
    const studentId = text(body, 'studentId', issues, { max: 32 });
    if (studentId && !/^[A-Za-z0-9-]{3,32}$/.test(studentId)) field(issues, 'studentId', 'must be 3–32 letters, digits or hyphens');
    studentLoginId = studentId?.toUpperCase() ?? null;
    secret = typeof body.pin === 'string' ? body.pin : '';
    if (!/^[0-9]{6}$/.test(secret)) field(issues, 'pin', 'must be exactly 6 digits');
  } else {
    const address = text(body, 'email', issues, { max: 254 });
    if (address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) field(issues, 'email', 'must be a valid email address');
    email = address?.toLowerCase() ?? null;
    secret = typeof body.password === 'string' ? body.password : '';
    if (secret.length < 10 || secret.length > 128) field(issues, 'password', 'must be 10–128 characters');
  }
  assertValid(issues);

  let schoolId: string | null = null;
  if (isSchoolScoped) {
    if (actor.role === 'school_admin') {
      if (body.schoolId !== undefined && body.schoolId !== actor.schoolId) {
        throw Errors.forbidden('School Admins can only create accounts in their own school.');
      }
      schoolId = actor.schoolId;
    } else {
      if (typeof body.schoolId !== 'string') throw Errors.validation([{ field: 'schoolId', message: 'is required for this role' }]);
      if (!state.schools.some((school) => school.id === body.schoolId)) {
        throw Errors.invalidReference('schoolId', 'School not found.');
      }
      schoolId = body.schoolId;
    }
  }

  if (email && state.users.some((user) => user.email === email)) throw Errors.duplicate('email');
  if (studentLoginId && state.users.some((user) => user.studentLoginId === studentLoginId)) {
    throw Errors.duplicate('studentId');
  }

  let parentId: string | null = null;
  if (isStudent && body.parentId !== undefined) {
    const parent = userById(body.parentId as string);
    if (!parent || parent.role !== 'parent' || !parent.isActive || parent.schoolId !== schoolId) {
      throw Errors.invalidReference('parentId', 'Parent not found in this school.');
    }
    parentId = parent.id;
  }

  const created: MockUser = {
    id: nextId(isStudent ? 'stu' : 'usr'),
    role,
    fullName: fullName ?? '',
    email,
    studentLoginId,
    schoolId,
    secret,
    isActive: true,
    createdAt: nowIso(),
  };
  state.users.push(created);
  if (parentId) state.parentLinks.push({ studentId: created.id, parentId, createdAt: nowIso() });
  return {
    status: 201,
    body: {
      user: {
        id: created.id,
        role: created.role,
        fullName: created.fullName,
        schoolId: created.schoolId,
        parentId,
        createdAt: created.createdAt,
      },
    },
  };
}

// ───────────────────────────── Schools ─────────────────────────────

function findSchool(id: string) {
  const school = state.schools.find((candidate) => candidate.id === id);
  if (!school) throw Errors.notFound('School');
  return school;
}

const schoolHandlers = {
  create({ body }: Context): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['name'], issues);
    const name = text(body, 'name', issues);
    assertValid(issues);
    const school = { id: nextId('sch'), name: name ?? '', createdAt: nowIso(), updatedAt: nowIso() };
    state.schools.push(school);
    return { status: 201, body: { school } };
  },
  list({ query }: Context): Result {
    const needle = query.name?.trim().toLowerCase();
    const schools = state.schools
      .filter((school) => !needle || school.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { body: paginate(schools, query, 'schools') };
  },
  view({ actor }: Context, schoolId: string): Result {
    const seesEverySchool = actor.role === 'platform_admin' || actor.role === 'psychologist';
    if (!seesEverySchool && actor.schoolId !== schoolId) throw Errors.notFound('School');
    return { body: { school: findSchool(schoolId) } };
  },
  rename({ body }: Context, schoolId: string): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['name'], issues);
    const name = text(body, 'name', issues);
    assertValid(issues);
    const school = findSchool(schoolId);
    school.name = name ?? school.name;
    school.updatedAt = nowIso();
    return { body: { school } };
  },
};

// ───────────────────────────── Users ─────────────────────────────

function managedUser(actor: MockUser, userId: string): MockUser {
  const user = userById(userId);
  if (!user || !isWithinReach(actor, user)) throw Errors.notFound('User');
  return user;
}

const userHandlers = {
  list({ actor, query }: Context): Result {
    const managed = rolesManagedBy(actor.role);
    if (actor.role !== 'platform_admin') {
      if (query.schoolId && query.schoolId !== actor.schoolId) {
        throw Errors.forbidden('School Admins can only list users in their own school.');
      }
      if (query.role && !managed.includes(query.role as Role)) {
        throw Errors.forbidden(`Your role cannot manage ${query.role} accounts.`);
      }
    }
    const needle = query.name?.trim().toLowerCase();
    const users = state.users
      .filter((user) => isWithinReach(actor, user))
      .filter((user) => !query.role || user.role === query.role)
      .filter((user) => !query.schoolId || user.schoolId === query.schoolId)
      .filter((user) => query.isActive === undefined || String(user.isActive) === query.isActive)
      .filter((user) => !needle || user.fullName.toLowerCase().includes(needle))
      .sort(byName)
      .map(toUser);
    return { body: paginate(users, query, 'users') };
  },
  view({ actor }: Context, userId: string): Result {
    return { body: { user: toUser(managedUser(actor, userId)) } };
  },
  update({ actor, body }: Context, userId: string): Result {
    const user = managedUser(actor, userId);
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['fullName', 'email', 'studentId'], issues);
    const isStudent = user.role === 'student';
    if (isStudent && body.email !== undefined) field(issues, 'email', 'is not allowed for students');
    if (!isStudent && body.studentId !== undefined) field(issues, 'studentId', 'is allowed for students only');
    const fullName = text(body, 'fullName', issues, { max: 100, isOptional: true });
    const email = text(body, 'email', issues, { max: 254, isOptional: true })?.toLowerCase();
    const studentLoginId = text(body, 'studentId', issues, { max: 32, isOptional: true })?.toUpperCase();
    assertValid(issues);
    if (email && state.users.some((other) => other.id !== user.id && other.email === email)) throw Errors.duplicate('email');
    if (studentLoginId && state.users.some((other) => other.id !== user.id && other.studentLoginId === studentLoginId)) {
      throw Errors.duplicate('studentId');
    }
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (studentLoginId) user.studentLoginId = studentLoginId;
    return { body: { user: toUser(user) } };
  },
  setActive({ actor }: Context, userId: string, isActive: boolean): Result {
    if (userId === actor.id) {
      throw Errors.forbidden(`You cannot ${isActive ? 'reactivate' : 'deactivate'} your own account.`);
    }
    const user = managedUser(actor, userId);
    user.isActive = isActive;
    return { body: { user: toUser(user) } };
  },
};

// ───────────────────────────── Parent ↔ student links ─────────────────────────────

function toLink(link: MockState['parentLinks'][number]) {
  return { parent: person(userById(link.parentId)), student: person(userById(link.studentId)), createdAt: link.createdAt };
}

const parentLinkHandlers = {
  create({ actor, body }: Context): Result {
    const parent = userById(body.parentId as string);
    const student = userById(body.studentId as string);
    const inScope = (user: MockUser | undefined) =>
      user !== undefined && (actor.role === 'platform_admin' || user.schoolId === actor.schoolId);
    if (!student || student.role !== 'student' || !inScope(student)) {
      throw Errors.invalidReference('studentId', 'Student not found.');
    }
    if (!parent || parent.role !== 'parent' || !parent.isActive || !inScope(parent) || parent.schoolId !== student.schoolId) {
      throw Errors.invalidReference('parentId', 'Parent not found in this school.');
    }
    if (parentOf(student.id)) throw Errors.conflict('This student already has a parent. Unlink them first.');
    const link = { studentId: student.id, parentId: parent.id, createdAt: nowIso() };
    state.parentLinks.push(link);
    return { status: 201, body: { link: toLink(link) } };
  },
  list({ actor, query }: Context): Result {
    const links = state.parentLinks
      .filter((link) => {
        if (actor.role === 'parent') return link.parentId === actor.id;
        if (actor.role === 'school_admin') return userById(link.studentId)?.schoolId === actor.schoolId;
        return true;
      })
      .filter((link) => !query.parentId || link.parentId === query.parentId)
      .filter((link) => !query.studentId || link.studentId === query.studentId)
      .map(toLink)
      .sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
    return { body: paginate(links, query, 'links') };
  },
  remove({ actor }: Context, studentId: string): Result {
    const student = userById(studentId);
    const index = state.parentLinks.findIndex((link) => link.studentId === studentId);
    const inScope = student && (actor.role === 'platform_admin' || student.schoolId === actor.schoolId);
    if (!inScope || index === -1) throw Errors.notFound('Parent link');
    state.parentLinks.splice(index, 1);
    return { status: 204 };
  },
};

// ───────────────────────────── Classes ─────────────────────────────

function visibleClass(actor: MockUser, classId: string) {
  const group = state.classes.find((candidate) => candidate.id === classId);
  const isVisible =
    group &&
    group.schoolId === actor.schoolId &&
    (actor.role === 'school_admin' ||
      state.classTeachers.some((row) => row.classId === group.id && row.teacherId === actor.id));
  if (!group || !isVisible) throw Errors.notFound('Class');
  return group;
}

function classNameTaken(schoolId: string, name: string, exceptId?: string): boolean {
  return state.classes.some(
    (group) => group.schoolId === schoolId && group.id !== exceptId && group.name.toLowerCase() === name.toLowerCase(),
  );
}

function sameSchoolMember(actor: MockUser, userId: string, role: Role): MockUser {
  const user = userById(userId);
  if (!user || user.role !== role || user.schoolId !== actor.schoolId) {
    throw Errors.notFound(role === 'teacher' ? 'Teacher' : 'Student');
  }
  return user;
}

const classHandlers = {
  create({ actor, body }: Context): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['name'], issues);
    const name = text(body, 'name', issues, { max: 100 });
    assertValid(issues);
    if (classNameTaken(actor.schoolId ?? '', name ?? '')) throw Errors.conflict('A class with this name already exists.');
    const group = { id: nextId('cls'), schoolId: actor.schoolId ?? '', name: name ?? '', createdAt: nowIso(), updatedAt: nowIso() };
    state.classes.push(group);
    return { status: 201, body: { class: group } };
  },
  list({ actor, query }: Context): Result {
    const needle = query.name?.trim().toLowerCase();
    const classes = state.classes
      .filter((group) => group.schoolId === actor.schoolId)
      .filter(
        (group) =>
          actor.role === 'school_admin' ||
          state.classTeachers.some((row) => row.classId === group.id && row.teacherId === actor.id),
      )
      .filter((group) => !needle || group.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { body: paginate(classes, query, 'classes') };
  },
  view({ actor }: Context, classId: string): Result {
    const group = visibleClass(actor, classId);
    const members = (ids: string[]) => ids.map((id) => person(userById(id))).sort(byName);
    return {
      body: {
        class: group,
        teachers: members(state.classTeachers.filter((row) => row.classId === classId).map((row) => row.teacherId)),
        students: members(state.classStudents.filter((row) => row.classId === classId).map((row) => row.studentId)),
      },
    };
  },
  rename({ actor, body }: Context, classId: string): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['name'], issues);
    const name = text(body, 'name', issues, { max: 100 });
    assertValid(issues);
    const group = visibleClass(actor, classId);
    if (classNameTaken(group.schoolId, name ?? '', group.id)) throw Errors.conflict('A class with this name already exists.');
    group.name = name ?? group.name;
    group.updatedAt = nowIso();
    return { body: { class: group } };
  },
  addTeacher({ actor }: Context, classId: string, teacherId: string): Result {
    visibleClass(actor, classId);
    sameSchoolMember(actor, teacherId, 'teacher');
    if (!state.classTeachers.some((row) => row.classId === classId && row.teacherId === teacherId)) {
      state.classTeachers.push({ classId, teacherId });
    }
    return { status: 204 };
  },
  removeTeacher({ actor }: Context, classId: string, teacherId: string): Result {
    visibleClass(actor, classId);
    const index = state.classTeachers.findIndex((row) => row.classId === classId && row.teacherId === teacherId);
    if (index === -1) throw Errors.notFound('Teacher');
    state.classTeachers.splice(index, 1);
    return { status: 204 };
  },
  addStudent({ actor }: Context, classId: string, studentId: string): Result {
    visibleClass(actor, classId);
    sameSchoolMember(actor, studentId, 'student');
    const current = classOfStudent(studentId);
    if (current === classId) return { status: 204 };
    if (current) throw Errors.conflict('This student is already in another class. Remove them from it first.');
    state.classStudents.push({ classId, studentId });
    return { status: 204 };
  },
  removeStudent({ actor }: Context, classId: string, studentId: string): Result {
    visibleClass(actor, classId);
    const index = state.classStudents.findIndex((row) => row.classId === classId && row.studentId === studentId);
    if (index === -1) throw Errors.notFound('Student');
    state.classStudents.splice(index, 1);
    return { status: 204 };
  },
};

// ───────────────────────────── Observations ─────────────────────────────

function readObservationBody(body: Body, isTeacher: boolean) {
  const issues: FieldIssue[] = [];
  rejectUnknown(
    body,
    ['studentId', 'tone', 'area', 'description', 'when', 'howOften', ...(isTeacher ? ['level', 'learningBehaviourArea'] : [])],
    issues,
  );
  const studentId = text(body, 'studentId', issues, { max: 64 });
  const tone = oneOf(body, 'tone', TONES, issues, true) ?? 'concern';
  const area = oneOf(body, 'area', AREAS, issues);
  const description = text(body, 'description', issues, { max: 2000 });
  const when = oneOf(body, 'when', WHENS, issues);
  const howOften = oneOf(body, 'howOften', FREQUENCIES, issues);
  const level = isTeacher ? oneOf(body, 'level', LEVELS, issues, true) : undefined;
  const learningBehaviourArea = isTeacher ? oneOf(body, 'learningBehaviourArea', LEARNING_BEHAVIOUR_AREAS, issues, true) : undefined;
  assertValid(issues);
  // Level says how worrying a concern is; something good is never Significant.
  if (tone === 'positive' && level !== undefined) {
    throw Errors.validation([{ field: 'level', message: 'is not allowed on a positive observation' }]);
  }
  return { studentId: studentId ?? '', tone, area: area!, description: description ?? '', when: when!, howOften: howOften!, level, learningBehaviourArea };
}

function createObservation(actor: MockUser, body: Body, authorRole: 'parent' | 'teacher'): MockObservation {
  const input = readObservationBody(body, authorRole === 'teacher');
  const student = studentInScope(actor, input.studentId);
  if (!student || !student.schoolId) throw Errors.invalidReference('studentId', 'Student not found.');
  const observation: MockObservation = {
    id: nextId('obs'),
    schoolId: student.schoolId,
    studentId: student.id,
    authorId: actor.id,
    authorRole,
    tone: input.tone,
    area: input.area,
    description: input.description,
    when: input.when,
    howOften: input.howOften,
    level: input.level ?? null,
    learningBehaviourArea: input.learningBehaviourArea ?? null,
    // A star is celebrated straight away; a concern waits for review.
    status: input.tone === 'positive' ? 'celebrated' : 'pending',
    reviewOutcome: null,
    developmentArea: null,
    teacherOnlyNote: null,
    reviewedById: null,
    reviewedAt: null,
    createdAt: nowIso(),
  };
  state.observations.unshift(observation);
  return observation;
}

function findObservation(id: string): MockObservation {
  const observation = state.observations.find((candidate) => candidate.id === id);
  if (!observation) throw Errors.notFound('Observation');
  return observation;
}

function ownObservations(actor: MockUser, query: Query): MockObservation[] {
  return state.observations
    .filter((o) => o.authorId === actor.id)
    .filter((o) => !query.status || o.status === query.status)
    .sort(newestFirst);
}

const observationHandlers = {
  createAsTeacher({ actor, body }: Context): Result {
    return { status: 201, body: { observation: toTeacherObservation(createObservation(actor, body, 'teacher')) } };
  },
  createAsParent({ actor, body }: Context): Result {
    return { status: 201, body: { observation: toParentObservation(createObservation(actor, body, 'parent')) } };
  },
  listAsTeacher({ actor, query }: Context): Result {
    return { body: paginate(ownObservations(actor, query).map(toTeacherObservation), query, 'observations') };
  },
  listAsParent({ actor, query }: Context): Result {
    return { body: paginate(ownObservations(actor, query).map(toParentObservation), query, 'observations') };
  },
  queue({ query }: Context): Result {
    const direction = query.sortOrder === 'asc' ? -1 : 1;
    const observations = state.observations
      .filter((o) => !query.tone || o.tone === query.tone)
      .filter((o) => !query.status || o.status === query.status)
      .filter((o) => !query.level || o.level === query.level)
      .filter((o) => !query.authorRole || o.authorRole === query.authorRole)
      .filter((o) => !query.schoolId || o.schoolId === query.schoolId)
      .filter((o) => !query.studentId || o.studentId === query.studentId)
      .filter((o) => !query.area || o.area === query.area)
      .sort((a, b) => newestFirst(a, b) * direction)
      .map(toReviewObservation);
    return { body: paginate(observations, query, 'observations') };
  },
  detail(_context: Context, observationId: string): Result {
    const observation = findObservation(observationId);
    const history = state.observations
      .filter((o) => o.studentId === observation.studentId && o.id !== observation.id)
      .sort(newestFirst)
      .slice(0, HISTORY_SIZE)
      .map(toReviewObservation);
    return { body: { observation: toReviewObservation(observation), history } };
  },
  review({ actor, body }: Context, observationId: string): Result {
    const issues: FieldIssue[] = [];
    const outcome = oneOf(body, 'outcome', ['assigned', 'no_action'] as const, issues);
    rejectUnknown(body, ['outcome', 'developmentArea', 'teacherOnlyNote', ...(outcome === 'assigned' ? ['activityIds'] : [])], issues);
    const developmentArea = oneOf(body, 'developmentArea', DEVELOPMENT_AREAS, issues, true);
    const teacherOnlyNote = text(body, 'teacherOnlyNote', issues, { max: 2000, isOptional: true });
    const activityIds = outcome === 'assigned' ? body.activityIds : [];
    if (outcome === 'assigned') {
      if (!Array.isArray(activityIds) || activityIds.length < 1 || activityIds.length > 10) {
        field(issues, 'activityIds', 'must list 1–10 activities');
      } else if (new Set(activityIds).size !== activityIds.length) {
        field(issues, 'activityIds', 'must not contain duplicates');
      }
    }
    assertValid(issues);

    const observation = findObservation(observationId);
    if (observation.tone === 'positive') throw Errors.conflict('Positive observations are celebrated, not reviewed.');
    if (observation.status !== 'pending') throw Errors.conflict('This observation has already been reviewed.');
    if (observation.level === 'significant' && developmentArea === undefined) {
      throw Errors.validation([{ field: 'developmentArea', message: 'is required for Significant observations' }]);
    }
    const chosen = (activityIds as string[]).map((id) =>
      state.activities.find((activity) => activity.id === id && activity.archivedAt === null),
    );
    if (chosen.some((activity) => activity === undefined)) {
      throw Errors.invalidReference('activityIds', 'Every activity must exist and not be archived.');
    }

    // One transaction on the backend: assignments and the review land together.
    for (const activity of chosen as MockActivity[]) {
      state.assignments.push({
        id: nextId('asg'),
        activityId: activity.id,
        studentId: observation.studentId,
        assignedById: actor.id,
        source: 'recommended',
        observationId: observation.id,
        createdAt: nowIso(),
      });
    }
    Object.assign(observation, {
      status: 'reviewed',
      reviewOutcome: outcome,
      developmentArea: developmentArea ?? null,
      teacherOnlyNote: teacherOnlyNote ?? null,
      reviewedById: actor.id,
      reviewedAt: nowIso(),
    });
    return { body: { observation: toReviewObservation(observation) } };
  },
};

// ───────────────────────────── Activities ─────────────────────────────

const isHttpUrl = (value: unknown) => typeof value === 'string' && /^https?:\/\/\S+$/.test(value);

function readContent(raw: unknown, issues: FieldIssue[]): ActivityContent | undefined {
  if (!raw || typeof raw !== 'object') {
    field(issues, 'content', 'is required');
    return undefined;
  }
  const content = raw as Body;
  const type = oneOf(content, 'type', ACTIVITY_TYPES, issues);
  const prompt = typeof content.prompt === 'string' ? content.prompt.trim() : '';
  if (!prompt) field(issues, 'content.prompt', 'is required');
  if (!type) return undefined;
  if (type === 'mcq' || type === 'image_pick') {
    const options = Array.isArray(content.options) ? (content.options as Body[]) : [];
    if (options.length < 2 || options.length > 6) field(issues, 'content.options', 'must have 2–6 options');
    const ids = options.map((option) => option.id);
    if (ids.some((id) => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,32}$/.test(id))) {
      field(issues, 'content.options', 'every option needs an id of 1–32 letters, digits, "_" or "-"');
    }
    if (new Set(ids).size !== ids.length) field(issues, 'content.options', 'option ids must be unique');
    if (type === 'mcq') {
      if (options.some((option) => typeof option.label !== 'string' || !option.label.trim())) {
        field(issues, 'content.options', 'every option needs a label');
      }
      return { type, prompt, options: options.map((option) => ({ id: String(option.id), label: String(option.label).trim() })) };
    }
    if (options.some((option) => !isHttpUrl(option.imageUrl))) field(issues, 'content.options', 'every image must be an http(s) URL');
    return {
      type,
      prompt,
      options: options.map((option) => ({
        id: String(option.id),
        imageUrl: String(option.imageUrl),
        ...(typeof option.label === 'string' && option.label.trim() ? { label: option.label.trim() } : {}),
      })),
    };
  }
  if (type === 'media_response') {
    if (!isHttpUrl(content.mediaUrl)) field(issues, 'content.mediaUrl', 'must be an http(s) URL');
    return { type, prompt, mediaUrl: String(content.mediaUrl) };
  }
  return { type, prompt };
}

/** The type and options, frozen once an activity has been assigned. */
function structureOf(content: ActivityContent): string {
  return JSON.stringify({ type: content.type, options: 'options' in content ? content.options : null });
}

function findActivity(actor: MockUser, id: string): MockActivity {
  const activity = state.activities.find((candidate) => candidate.id === id);
  if (!activity || (activity.archivedAt !== null && actor.role !== 'psychologist')) throw Errors.notFound('Activity');
  return activity;
}

const activityHandlers = {
  create({ actor, body }: Context): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['title', 'content'], issues);
    const title = text(body, 'title', issues);
    const content = readContent(body.content, issues);
    assertValid(issues);
    const activity: MockActivity = {
      id: nextId('act'),
      title: title ?? '',
      content: content!,
      createdById: actor.id,
      archivedAt: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    state.activities.push(activity);
    return { status: 201, body: { activity: toActivity(activity) } };
  },
  list({ actor, query }: Context): Result {
    const wantsArchived = query.isArchived === 'true';
    if (wantsArchived && actor.role !== 'psychologist') throw Errors.forbidden('Only psychologists can browse archived activities.');
    const needle = query.title?.trim().toLowerCase();
    const direction = query.sortOrder === 'desc' ? -1 : 1;
    const activities = state.activities
      .filter((activity) => (activity.archivedAt !== null) === wantsArchived)
      .filter((activity) => !query.type || activity.content.type === query.type)
      .filter((activity) => !needle || activity.title.toLowerCase().includes(needle))
      .sort((a, b) =>
        (query.sortBy === 'createdAt' ? a.createdAt.localeCompare(b.createdAt) : a.title.localeCompare(b.title)) * direction,
      )
      .map(toActivity);
    return { body: paginate(activities, query, 'activities') };
  },
  view({ actor }: Context, activityId: string): Result {
    return { body: { activity: toActivity(findActivity(actor, activityId)) } };
  },
  update({ actor, body }: Context, activityId: string): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['title', 'content'], issues);
    const title = text(body, 'title', issues, { isOptional: true });
    const content = body.content === undefined ? undefined : readContent(body.content, issues);
    if (title === undefined && body.content === undefined) field(issues, 'body', 'Provide title and/or content.');
    assertValid(issues);
    const activity = findActivity(actor, activityId);
    const isAssigned = state.assignments.some((assignment) => assignment.activityId === activity.id);
    if (content && isAssigned && structureOf(content) !== structureOf(activity.content)) {
      throw Errors.conflict(
        "This activity has been assigned, so its type and options can't change. Archive it and create a new one.",
      );
    }
    if (title) activity.title = title;
    if (content) activity.content = content;
    activity.updatedAt = nowIso();
    return { body: { activity: toActivity(activity) } };
  },
  archive({ actor }: Context, activityId: string): Result {
    const activity = findActivity(actor, activityId);
    activity.archivedAt ??= nowIso();
    return { body: { activity: toActivity(activity) } };
  },
};

// ───────────────────────────── Assignments and completions ─────────────────────────────

function assignmentsOf(studentId: string, query: Query): MockAssignment[] {
  return state.assignments
    .filter((assignment) => assignment.studentId === studentId)
    .filter((assignment) => query.isDone === undefined || String(completionOf(assignment.id) !== undefined) === query.isDone)
    .sort(newestFirst);
}

function readAnswer(raw: unknown, issues: FieldIssue[]): ActivityAnswer | undefined {
  if (!raw || typeof raw !== 'object') {
    field(issues, 'answer', 'is required');
    return undefined;
  }
  const answer = raw as Body;
  const type = oneOf(answer, 'type', ACTIVITY_TYPES, issues);
  if (type === 'mcq' || type === 'image_pick') {
    if (typeof answer.optionId !== 'string' || !answer.optionId) field(issues, 'answer.optionId', 'is required');
    return { type, optionId: String(answer.optionId) };
  }
  if (type === 'rating') {
    if (!Number.isInteger(answer.rating) || (answer.rating as number) < 1 || (answer.rating as number) > 5) {
      field(issues, 'answer.rating', 'must be a whole number from 1 to 5');
    }
    return { type, rating: Number(answer.rating) };
  }
  if (type === 'text' || type === 'media_response') {
    if (typeof answer.text !== 'string' || !answer.text.trim()) field(issues, 'answer.text', 'is required');
    return { type, text: String(answer.text ?? '').trim() };
  }
  return undefined;
}

const assignmentHandlers = {
  assignDirect({ actor, body }: Context): Result {
    const student = studentInScope(actor, String(body.studentId ?? ''));
    if (!student) throw Errors.invalidReference('studentId', 'Student not found.');
    const activity = state.activities.find((candidate) => candidate.id === body.activityId && candidate.archivedAt === null);
    if (!activity) throw Errors.invalidReference('activityId', 'Activity not found or archived.');
    const assignment: MockAssignment = {
      id: nextId('asg'),
      activityId: activity.id,
      studentId: student.id,
      assignedById: actor.id,
      source: 'direct',
      observationId: null,
      createdAt: nowIso(),
    };
    state.assignments.push(assignment);
    return { status: 201, body: { assignment: toStaffAssignment(assignment) } };
  },
  mine({ actor, query }: Context): Result {
    return { body: paginate(assignmentsOf(actor.id, query).map(toStudentAssignment), query, 'assignments') };
  },
  forStaff({ actor, query }: Context, studentId: string): Result {
    const student = studentInScope(actor, studentId);
    if (!student) throw Errors.notFound('Student');
    return { body: paginate(assignmentsOf(student.id, query).map(toStaffAssignment), query, 'assignments') };
  },
  forParent({ actor, query }: Context, studentId: string): Result {
    const student = studentInScope(actor, studentId);
    if (!student) throw Errors.notFound('Student');
    return { body: paginate(assignmentsOf(student.id, query).map(toFamilyAssignment), query, 'assignments') };
  },
  complete({ actor, body }: Context): Result {
    const issues: FieldIssue[] = [];
    rejectUnknown(body, ['assignmentId', 'answer'], issues);
    const answer = readAnswer(body.answer, issues);
    assertValid(issues);
    const assignment = state.assignments.find((candidate) => candidate.id === body.assignmentId && candidate.studentId === actor.id);
    if (!assignment) throw Errors.notFound('Assignment');
    if (completionOf(assignment.id)) throw Errors.conflict('This activity has already been completed.');
    const content = activityOf(assignment).content;
    if (answer!.type !== content.type) {
      throw Errors.validation([{ field: 'answer.type', message: `must be "${content.type}" for this activity` }]);
    }
    if ('optionId' in answer! && 'options' in content && !content.options.some((option) => option.id === (answer as { optionId: string }).optionId)) {
      throw Errors.validation([{ field: 'answer.optionId', message: 'is not an option of this activity' }]);
    }
    const completion = { id: nextId('cmp'), assignmentId: assignment.id, answer: answer!, completedAt: nowIso() };
    state.completions.push(completion);
    return { status: 201, body: { completion } };
  },
};

// ───────────────────────────── Progress ─────────────────────────────

function completionDays(studentId: string, until?: string): string[] {
  return state.assignments
    .filter((assignment) => assignment.studentId === studentId)
    .flatMap((assignment) => {
      const completion = completionOf(assignment.id);
      return completion ? [businessDate(completion.completedAt)] : [];
    })
    .filter((day) => !until || day < until);
}

/** Distinct development areas of "assigned" reviews, most recent first, at most five. */
function growthAreasOf(studentId: string, beforeDay?: string): string[] {
  const reviewed = state.observations
    .filter(
      (o) =>
        o.studentId === studentId &&
        o.reviewOutcome === 'assigned' &&
        o.developmentArea !== null &&
        o.reviewedAt !== null &&
        (!beforeDay || businessDate(o.reviewedAt) < beforeDay),
    )
    .sort((a, b) => (b.reviewedAt ?? '').localeCompare(a.reviewedAt ?? ''));
  const areas: DevelopmentArea[] = [];
  for (const o of reviewed) {
    if (o.developmentArea && !areas.includes(o.developmentArea)) areas.push(o.developmentArea);
  }
  return areas.slice(0, MAX_GROWTH_AREAS).map((area) => DEVELOPMENT_AREA_NAMES[area]);
}

/** A student's stars: their positive observations, newest first. */
function starsOf(studentId: string): MockObservation[] {
  return state.observations.filter((o) => o.studentId === studentId && o.tone === 'positive').sort(newestFirst);
}

/** The backend's star shape: the words, the area and who gave it — never the learning-behaviour area. */
function toStar(o: MockObservation) {
  return {
    id: o.id,
    studentId: o.studentId,
    area: o.area,
    description: o.description,
    givenBy: { fullName: person(userById(o.authorId)).fullName, role: o.authorRole },
    createdAt: o.createdAt,
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const listOf = (items: string[]) =>
  items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;

function monthLabel(month: string): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, monthNumber - 1, 1)),
  );
}

/** The backend's template, sentence for sentence. */
function buildSummaryText(student: MockUser, month: string, isCurrentMonth: boolean): string {
  const nextMonthFirst = `${addMonths(month, 1)}-01`;
  const days = completionDays(student.id).filter((day) => day.startsWith(month));
  const completed = days.length;
  const activeDays = [...new Set(days)];
  const label = monthLabel(month);
  const name = student.fullName;
  const sentences: string[] = [];
  if (completed === 0) {
    sentences.push(
      isCurrentMonth ? `${name} has not completed any activities yet in ${label}.` : `${name} did not complete any activities in ${label}.`,
    );
  } else {
    const done = `${plural(completed, 'activity', 'activities')} on ${plural(activeDays.length, 'day', 'different days')}`;
    sentences.push(isCurrentMonth ? `So far in ${label}, ${name} has completed ${done}.` : `In ${label}, ${name} completed ${done}.`);
    const longest = longestRun(activeDays);
    if (longest >= 2) sentences.push(`Their longest streak was ${longest} days in a row.`);
  }
  const stars = starsOf(student.id).filter((o) => businessDate(o.createdAt).startsWith(month)).length;
  if (stars > 0) {
    const count = plural(stars, 'star', 'stars');
    sentences.push(isCurrentMonth ? `${name} has earned ${count} this month.` : `${name} earned ${count} that month.`);
  }
  const areas = growthAreasOf(student.id, isCurrentMonth ? undefined : nextMonthFirst);
  if (areas.length > 0) sentences.push(`Areas ${name} is working on: ${listOf(areas)}.`);
  return sentences.join(' ');
}

function progressStudent(actor: MockUser, studentId: string): MockUser {
  const student = studentInScope(actor, studentId);
  if (!student) throw Errors.notFound('Student');
  return student;
}

const progressHandlers = {
  growthAreas({ actor }: Context, studentId: string): Result {
    const student = progressStudent(actor, studentId);
    return { body: { growthAreas: growthAreasOf(student.id).map((name) => ({ name })) } };
  },
  streak({ actor }: Context, studentId: string): Result {
    const student = progressStudent(actor, studentId);
    return { body: { streak: { days: currentStreak(completionDays(student.id), businessDate()) } } };
  },
  stars({ actor, query }: Context, studentId: string): Result {
    const student = progressStudent(actor, studentId);
    return { body: paginate(starsOf(student.id).map(toStar), query, 'stars') };
  },
  monthlySummary({ actor }: Context, studentId: string, month: string): Result {
    const student = progressStudent(actor, studentId);
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw Errors.validation([{ field: 'month', message: 'must be YYYY-MM' }]);
    const currentMonth = businessMonth();
    if (month > currentMonth) throw Errors.validation([{ field: 'month', message: 'must not be in the future' }]);
    if (month < businessMonth(student.createdAt)) throw Errors.notFound('Monthly summary');
    const isCurrentMonth = month === currentMonth;
    const key = `${student.id}:${month}`;
    let summaryText: string;
    if (isCurrentMonth) {
      summaryText = buildSummaryText(student, month, true);
    } else {
      // A finished month is stored the first time and never changes.
      state.monthlySummaries[key] ??= buildSummaryText(student, month, false);
      summaryText = state.monthlySummaries[key];
    }
    return { body: { summary: { studentId: student.id, month, text: summaryText, isFinal: !isCurrentMonth } } };
  },
};

// ───────────────────────────── Routing ─────────────────────────────

const ALL: Role[] = ROLES;
const ADMINS: Role[] = ['platform_admin', 'school_admin'];

type Handler = (context: Context, ...params: string[]) => Result;

interface Route {
  method: HttpMethod;
  /** Segments; ":name" matches any one segment and is passed to the handler in order. */
  path: string;
  roles: Role[];
  handle: Handler;
}

const ROUTES: Route[] = [
  { method: 'POST', path: '/auth/register', roles: ADMINS, handle: register },
  { method: 'POST', path: '/auth/logout', roles: ALL, handle: ({ actor, body }) => logout(actor, body) },

  { method: 'POST', path: '/schools', roles: ['platform_admin'], handle: schoolHandlers.create },
  { method: 'GET', path: '/schools', roles: ['platform_admin', 'psychologist'], handle: schoolHandlers.list },
  { method: 'GET', path: '/schools/:id', roles: ALL, handle: schoolHandlers.view },
  { method: 'PATCH', path: '/schools/:id', roles: ['platform_admin'], handle: schoolHandlers.rename },

  { method: 'GET', path: '/users', roles: ADMINS, handle: userHandlers.list },
  { method: 'GET', path: '/users/:id', roles: ADMINS, handle: userHandlers.view },
  { method: 'PATCH', path: '/users/:id', roles: ADMINS, handle: userHandlers.update },
  { method: 'POST', path: '/users/:id/deactivate', roles: ADMINS, handle: (c, id) => userHandlers.setActive(c, id ?? '', false) },
  { method: 'POST', path: '/users/:id/reactivate', roles: ADMINS, handle: (c, id) => userHandlers.setActive(c, id ?? '', true) },

  { method: 'POST', path: '/parent-students', roles: ADMINS, handle: parentLinkHandlers.create },
  { method: 'GET', path: '/parent-students', roles: [...ADMINS, 'parent'], handle: parentLinkHandlers.list },
  { method: 'DELETE', path: '/parent-students/:id', roles: ADMINS, handle: parentLinkHandlers.remove },

  { method: 'POST', path: '/classes', roles: ['school_admin'], handle: classHandlers.create },
  { method: 'GET', path: '/classes', roles: ['school_admin', 'teacher'], handle: classHandlers.list },
  { method: 'GET', path: '/classes/:id', roles: ['school_admin', 'teacher'], handle: classHandlers.view },
  { method: 'PATCH', path: '/classes/:id', roles: ['school_admin'], handle: classHandlers.rename },
  { method: 'PUT', path: '/classes/:id/teachers/:id', roles: ['school_admin'], handle: classHandlers.addTeacher },
  { method: 'DELETE', path: '/classes/:id/teachers/:id', roles: ['school_admin'], handle: classHandlers.removeTeacher },
  { method: 'PUT', path: '/classes/:id/students/:id', roles: ['school_admin'], handle: classHandlers.addStudent },
  { method: 'DELETE', path: '/classes/:id/students/:id', roles: ['school_admin'], handle: classHandlers.removeStudent },

  { method: 'POST', path: '/observations', roles: ['teacher'], handle: observationHandlers.createAsTeacher },
  { method: 'GET', path: '/observations/mine', roles: ['teacher'], handle: observationHandlers.listAsTeacher },
  { method: 'GET', path: '/observations', roles: ['psychologist'], handle: observationHandlers.queue },
  { method: 'GET', path: '/observations/:id', roles: ['psychologist'], handle: observationHandlers.detail },
  { method: 'POST', path: '/observations/:id/review', roles: ['psychologist'], handle: observationHandlers.review },
  { method: 'POST', path: '/family/observations', roles: ['parent'], handle: observationHandlers.createAsParent },
  { method: 'GET', path: '/family/observations', roles: ['parent'], handle: observationHandlers.listAsParent },

  { method: 'POST', path: '/activities', roles: ['psychologist'], handle: activityHandlers.create },
  { method: 'GET', path: '/activities', roles: ['psychologist', 'teacher'], handle: activityHandlers.list },
  { method: 'GET', path: '/activities/:id', roles: ['psychologist', 'teacher'], handle: activityHandlers.view },
  { method: 'PATCH', path: '/activities/:id', roles: ['psychologist'], handle: activityHandlers.update },
  { method: 'POST', path: '/activities/:id/archive', roles: ['psychologist'], handle: activityHandlers.archive },

  { method: 'POST', path: '/assignments', roles: ['teacher'], handle: assignmentHandlers.assignDirect },
  { method: 'GET', path: '/assignments/mine', roles: ['student'], handle: assignmentHandlers.mine },
  { method: 'POST', path: '/activity-completions', roles: ['student'], handle: assignmentHandlers.complete },
  { method: 'GET', path: '/students/:id/assignments', roles: ['teacher', 'psychologist'], handle: assignmentHandlers.forStaff },
  { method: 'GET', path: '/family/children/:id/assignments', roles: ['parent'], handle: assignmentHandlers.forParent },

  { method: 'GET', path: '/students/:id/growth-areas', roles: ['student', 'parent', 'teacher', 'psychologist'], handle: progressHandlers.growthAreas },
  { method: 'GET', path: '/students/:id/streak', roles: ['student', 'parent', 'teacher', 'psychologist'], handle: progressHandlers.streak },
  { method: 'GET', path: '/students/:id/stars', roles: ['student', 'parent', 'teacher', 'psychologist'], handle: progressHandlers.stars },
  {
    method: 'GET',
    path: '/students/:id/monthly-summaries/:id',
    roles: ['student', 'parent', 'teacher', 'psychologist'],
    handle: progressHandlers.monthlySummary,
  },
];

function match(route: Route, method: HttpMethod, segments: string[]): string[] | null {
  if (route.method !== method) return null;
  const pattern = route.path.split('/').filter(Boolean);
  if (pattern.length !== segments.length) return null;
  const params: string[] = [];
  for (const [index, part] of pattern.entries()) {
    const segment = segments[index] ?? '';
    if (part.startsWith(':')) params.push(decodeURIComponent(segment));
    else if (part !== segment) return null;
  }
  return params;
}

function route(method: HttpMethod, path: string, query: Query, body: Body, headers: Record<string, string>): Result {
  const segments = path.split('?')[0]!.split('/').filter(Boolean);

  // Public: sign-in and token refresh.
  if (method === 'POST' && path === '/auth/login') return login(body);
  if (method === 'POST' && path === '/auth/refresh') return refresh(body);

  const candidates = ROUTES.map((candidate) => ({ candidate, params: match(candidate, method, segments) })).filter(
    (entry): entry is { candidate: Route; params: string[] } => entry.params !== null,
  );
  if (candidates.length === 0) throw new MockHttpError(404, 'NOT_FOUND', `Route ${method} ${path} not found.`);

  const actor = actorFrom(headers);
  if (!actor) throw Errors.unauthenticated();

  // A fixed path ("/observations/mine") wins over a parameter ("/observations/:id").
  const chosen = candidates.find((entry) => entry.params.length === 0) ?? candidates[0]!;
  if (!chosen.candidate.roles.includes(actor.role)) throw Errors.forbidden();
  return chosen.candidate.handle({ actor, query, body }, ...chosen.params);
}

function normaliseQuery(query: RequestOptions['query']): Query {
  const bag: Query = {};
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') bag[key] = String(value);
  }
  return bag;
}

export async function handleMockRequest(
  method: HttpMethod,
  path: string,
  options: { query?: RequestOptions['query']; body?: unknown; headers: Record<string, string> },
): Promise<TransportResponse> {
  await delay();
  // A copy, as if it had crossed the network: nothing the caller holds is shared with the store.
  const body = options.body === undefined ? {} : (structuredClone(options.body) as Body);
  try {
    const result = route(method, path, normaliseQuery(options.query), body, options.headers);
    return { status: result.status ?? 200, body: result.body === undefined ? undefined : structuredClone(result.body) };
  } catch (error) {
    if (error instanceof MockHttpError) {
      return {
        status: error.status,
        body: { error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) } },
      };
    }
    throw error;
  }
}
