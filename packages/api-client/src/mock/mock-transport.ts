import type { HttpMethod, RequestOptions } from '../http-client';
import { ApiError } from '../http-client';
import { redactObservationForRole, redactObservationsForRole } from '../redaction';
import type {
  Activity,
  Assignment,
  ClassGroup,
  GrowthArea,
  HolisticIndex,
  MonthlySummary,
  Observation,
  School,
  StreakInfo,
  Student,
  StudentLevel,
  TeacherNote,
  User,
} from '../types';
import {
  ACTIVITIES,
  ASSIGNMENTS,
  CLASSES,
  GROWTH_AREAS,
  HOLISTIC_INDEXES,
  LEVEL_TITLES,
  MONTHLY_SUMMARIES,
  OBSERVATIONS,
  SCHOOLS,
  STUDENT_LEVELS,
  STUDENTS,
  TEACHER_NOTES,
  USERS,
} from './fixtures';

/**
 * In-memory stand-in for the backend, used while `VITE_API_BASE_URL` is unset.
 *
 * It answers exactly the paths listed in `endpoints.ts` so that swapping to the
 * real backend is a config change, not a code change. Writes persist for the
 * lifetime of the tab, which is enough to demo every flow end to end.
 */

const MAX_GROWTH_AREAS_PER_STUDENT = 5;

interface MockStore {
  users: User[];
  schools: School[];
  classes: ClassGroup[];
  students: Student[];
  observations: Observation[];
  activities: Activity[];
  assignments: Assignment[];
  growthAreas: GrowthArea[];
  teacherNotes: TeacherNote[];
  monthlySummaries: MonthlySummary[];
  levels: StudentLevel[];
  holisticIndexes: HolisticIndex[];
  currentUserId: string | null;
}

const store: MockStore = {
  users: structuredClone(USERS),
  schools: structuredClone(SCHOOLS),
  classes: structuredClone(CLASSES),
  students: structuredClone(STUDENTS),
  observations: structuredClone(OBSERVATIONS),
  activities: structuredClone(ACTIVITIES),
  assignments: structuredClone(ASSIGNMENTS),
  growthAreas: structuredClone(GROWTH_AREAS),
  teacherNotes: structuredClone(TEACHER_NOTES),
  monthlySummaries: structuredClone(MONTHLY_SUMMARIES),
  levels: structuredClone(STUDENT_LEVELS),
  holisticIndexes: structuredClone(HOLISTIC_INDEXES),
  currentUserId: null,
};

/** Tests reset between cases so one case cannot leak state into the next. */
export function resetMockStore(): void {
  store.users = structuredClone(USERS);
  store.schools = structuredClone(SCHOOLS);
  store.classes = structuredClone(CLASSES);
  store.students = structuredClone(STUDENTS);
  store.observations = structuredClone(OBSERVATIONS);
  store.activities = structuredClone(ACTIVITIES);
  store.assignments = structuredClone(ASSIGNMENTS);
  store.growthAreas = structuredClone(GROWTH_AREAS);
  store.teacherNotes = structuredClone(TEACHER_NOTES);
  store.monthlySummaries = structuredClone(MONTHLY_SUMMARIES);
  store.levels = structuredClone(STUDENT_LEVELS);
  store.holisticIndexes = structuredClone(HOLISTIC_INDEXES);
  store.currentUserId = null;
}

/** Lets `packages/auth` restore a session on reload without a login round-trip. */
export function setMockCurrentUser(userId: string | null): void {
  store.currentUserId = userId;
}

const LATENCY_MS = 180;

function delay(): Promise<void> {
  // Tests run without artificial latency; the browser gets enough to show
  // real loading states rather than a flash of content.
  const ms = import.meta.env?.MODE === 'test' ? 0 : LATENCY_MS;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

function currentUser(): User {
  const user = store.users.find((candidate) => candidate.id === store.currentUserId);
  if (!user) throw new ApiError(401, 'No active session');
  return user;
}

function requireStudent(studentId: string): Student {
  const student = store.students.find((candidate) => candidate.id === studentId);
  if (!student) throw new ApiError(404, `Student ${studentId} not found`);
  return student;
}

/**
 * The calendar day a moment falls on where the student is. Both sides of the
 * streak comparison use this: `toISOString()` would shift any timezone ahead
 * of UTC back a day, so something finished today never counted for today.
 */
function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return localDay(date);
}

function buildStreak(studentId: string): StreakInfo {
  const completedDays = new Set(
    store.assignments
      .filter((assignment) => assignment.studentId === studentId && assignment.completedAt)
      .map((assignment) => localDay(new Date(assignment.completedAt!))),
  );

  const lastSevenDays: boolean[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    lastSevenDays.push(completedDays.has(daysAgo(offset)));
  }

  let currentStreak = 0;
  for (let index = lastSevenDays.length - 1; index >= 0; index -= 1) {
    if (!lastSevenDays[index]) break;
    currentStreak += 1;
  }

  let longestStreak = 0;
  let run = 0;
  for (const done of lastSevenDays) {
    run = done ? run + 1 : 0;
    longestStreak = Math.max(longestStreak, run);
  }

  return { studentId, currentStreak, longestStreak, lastSevenDays };
}

/** Each level needs 100 XP more than the last, so level n ends at n × 100. */
const XP_PER_LEVEL = 100;

function titleForLevel(level: number): string {
  return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length) - 1] ?? LEVEL_TITLES[0];
}

function levelFor(studentId: string): StudentLevel {
  return (
    store.levels.find((candidate) => candidate.studentId === studentId) ?? {
      studentId,
      level: 1,
      title: titleForLevel(1),
      xp: 0,
      xpForNextLevel: XP_PER_LEVEL,
    }
  );
}

function awardXp(studentId: string, xp: number): void {
  const current = levelFor(studentId);
  const total = current.xp + xp;
  let level = current.level;
  while (total >= level * XP_PER_LEVEL) level += 1;
  const updated: StudentLevel = {
    studentId,
    level,
    title: titleForLevel(level),
    xp: total,
    xpForNextLevel: level * XP_PER_LEVEL,
  };
  store.levels = [...store.levels.filter((candidate) => candidate.studentId !== studentId), updated];
}

function matchesQuery(value: unknown, expected: string | undefined): boolean {
  if (expected === undefined) return true;
  return String(value) === expected;
}

type QueryBag = Record<string, string | undefined>;

function normaliseQuery(query: RequestOptions['query']): QueryBag {
  const bag: QueryBag = {};
  if (!query) return bag;
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') bag[key] = String(value);
  }
  return bag;
}

function visibleStudentsFor(user: User): Student[] {
  switch (user.role) {
    case 'student':
    case 'parent':
      return store.students.filter((student) => user.linkedStudentIds.includes(student.id));
    case 'teacher':
      return store.students.filter((student) => user.linkedStudentIds.includes(student.id));
    case 'psychologist':
    case 'school-admin':
      return store.students.filter((student) => student.schoolId === user.schoolId);
    case 'platform-admin':
      return store.students;
    default:
      return [];
  }
}

// --- route handlers ---------------------------------------------------------

function handleAuth(method: HttpMethod, segments: string[], body: unknown): unknown {
  const action = segments[1];

  if (method === 'POST' && action === 'login') {
    const { email } = (body ?? {}) as { email?: string };
    const user = store.users.find(
      (candidate) => candidate.email.toLowerCase() === (email ?? '').toLowerCase(),
    );
    if (!user) throw new ApiError(401, 'No account matches that email address');
    store.currentUserId = user.id;
    return { user, token: `mock-token.${user.id}` };
  }

  if (method === 'POST' && action === 'logout') {
    store.currentUserId = null;
    return undefined;
  }

  if (method === 'GET' && action === 'me') {
    return currentUser();
  }

  throw new ApiError(404, `Unhandled auth route: ${method} /auth/${action ?? ''}`);
}

function handleStudents(
  method: HttpMethod,
  segments: string[],
  query: QueryBag,
  body: unknown,
): unknown {
  const studentId = segments[1];
  const sub = segments[2];
  const user = currentUser();

  if (method === 'GET' && !studentId) {
    let students = visibleStudentsFor(user);
    if (query.classId) students = students.filter((s) => s.classId === query.classId);
    if (query.schoolId) students = students.filter((s) => s.schoolId === query.schoolId);
    if (query.parentId) {
      students = students.filter((s) => s.parentIds.includes(query.parentId!));
    }
    if (query.search) {
      const needle = query.search.toLowerCase();
      students = students.filter((s) => s.name.toLowerCase().includes(needle));
    }
    return students;
  }

  if (method === 'POST' && !studentId) {
    const input = body as Partial<Student>;
    if (!input.name) throw new ApiError(422, 'A student needs a name');
    const created: Student = {
      id: nextId('stu'),
      name: input.name,
      dateOfBirth: input.dateOfBirth ?? '',
      classId: input.classId ?? '',
      schoolId: input.schoolId ?? user.schoolId ?? 'sch-ridgeview',
      parentIds: input.parentIds ?? [],
      growthAreaIds: [],
    };
    store.students = [...store.students, created];
    return created;
  }

  if (!studentId) throw new ApiError(404, 'Unhandled students route');

  if (method === 'GET' && !sub) return requireStudent(studentId);

  if (method === 'GET' && sub === 'growth-areas') {
    requireStudent(studentId);
    return store.growthAreas
      .filter((area) => area.studentId === studentId)
      .slice(0, MAX_GROWTH_AREAS_PER_STUDENT);
  }

  if (method === 'GET' && sub === 'teacher-notes') {
    requireStudent(studentId);
    return store.teacherNotes
      .filter((note) => note.studentId === studentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (method === 'GET' && sub === 'monthly-summary') {
    requireStudent(studentId);
    const summaries = store.monthlySummaries
      .filter((summary) => summary.studentId === studentId)
      .sort((a, b) => b.month.localeCompare(a.month));
    return summaries[0] ?? null;
  }

  if (method === 'GET' && sub === 'streak') {
    requireStudent(studentId);
    return buildStreak(studentId);
  }

  if (method === 'GET' && sub === 'level') {
    requireStudent(studentId);
    return levelFor(studentId);
  }

  if (method === 'GET' && sub === 'holistic-index') {
    requireStudent(studentId);
    return store.holisticIndexes.find((index) => index.studentId === studentId) ?? null;
  }

  if (method === 'PATCH' && !sub) {
    const index = store.students.findIndex((candidate) => candidate.id === studentId);
    if (index === -1) throw new ApiError(404, `Student ${studentId} not found`);
    const existing = store.students[index]!;
    const updated = { ...existing, ...(body as Partial<Student>), id: existing.id };
    store.students[index] = updated;
    return updated;
  }

  if (method === 'DELETE' && !sub) {
    store.students = store.students.filter((candidate) => candidate.id !== studentId);
    return undefined;
  }

  throw new ApiError(404, `Unhandled students route: ${method}`);
}

function handleObservations(
  method: HttpMethod,
  segments: string[],
  query: QueryBag,
  body: unknown,
): unknown {
  const observationId = segments[1];
  const sub = segments[2];
  const user = currentUser();

  if (method === 'GET' && !observationId) {
    const visibleIds = new Set(visibleStudentsFor(user).map((student) => student.id));
    let observations = store.observations.filter((observation) =>
      visibleIds.has(observation.studentId),
    );

    if (query.studentId) {
      observations = observations.filter((o) => o.studentId === query.studentId);
    }
    if (query.status) observations = observations.filter((o) => o.status === query.status);
    if (query.authorRole) {
      observations = observations.filter((o) => o.authorRole === query.authorRole);
    }
    if (query.isSignificant !== undefined) {
      observations = observations.filter((o) =>
        matchesQuery(o.isSignificant, query.isSignificant),
      );
    }
    if (query.schoolId) {
      const inSchool = new Set(
        store.students.filter((s) => s.schoolId === query.schoolId).map((s) => s.id),
      );
      observations = observations.filter((o) => inSchool.has(o.studentId));
    }

    observations = [...observations].sort((a, b) => b.observedAt.localeCompare(a.observedAt));
    return redactObservationsForRole(observations, user.role);
  }

  if (method === 'POST' && !observationId) {
    const input = body as Partial<Observation>;
    if (!input.studentId || !input.area || !input.body) {
      throw new ApiError(422, 'An observation needs a student, an area and a description');
    }
    const created: Observation = {
      id: nextId('obs'),
      studentId: input.studentId,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role === 'teacher' ? 'teacher' : 'parent',
      area: input.area,
      body: input.body,
      context: input.context ?? 'at-home',
      frequency: input.frequency ?? 'first-time',
      observedAt: input.observedAt ?? new Date().toISOString(),
      createdAt: new Date().toISOString(),
      status: 'pending',
      isSignificant: input.isSignificant ?? false,
      ...(input.level ? { level: input.level } : {}),
      ...(input.learningBehaviourArea
        ? { learningBehaviourArea: input.learningBehaviourArea }
        : {}),
    };
    store.observations = [created, ...store.observations];
    return redactObservationForRole(created, user.role);
  }

  if (!observationId) throw new ApiError(404, 'Unhandled observations route');

  const index = store.observations.findIndex((candidate) => candidate.id === observationId);
  if (index === -1) throw new ApiError(404, `Observation ${observationId} not found`);
  const observation = store.observations[index]!;

  if (method === 'GET' && !sub) {
    return redactObservationForRole(observation, user.role);
  }

  if (method === 'POST' && sub === 'review') {
    const decision = body as {
      status: 'reviewed' | 'no-action-needed';
      taggedAreas?: Observation['taggedAreas'];
      teacherOnlyNote?: string;
    };
    const updated: Observation = {
      ...observation,
      status: decision.status,
      reviewedAt: new Date().toISOString(),
      reviewedById: user.id,
      ...(decision.taggedAreas ? { taggedAreas: decision.taggedAreas } : {}),
      ...(decision.teacherOnlyNote !== undefined
        ? { teacherOnlyNote: decision.teacherOnlyNote }
        : {}),
    };
    store.observations[index] = updated;
    return updated;
  }

  throw new ApiError(404, `Unhandled observations route: ${method}`);
}

function handleActivities(
  method: HttpMethod,
  segments: string[],
  query: QueryBag,
  body: unknown,
): unknown {
  const activityId = segments[1];
  const user = currentUser();

  if (method === 'GET' && !activityId) {
    let activities = [...store.activities];
    if (query.area) activities = activities.filter((a) => a.area === query.area);
    if (query.search) {
      const needle = query.search.toLowerCase();
      activities = activities.filter(
        (a) =>
          a.title.toLowerCase().includes(needle) ||
          a.description.toLowerCase().includes(needle),
      );
    }
    return activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  if (method === 'POST' && !activityId) {
    const input = body as Partial<Activity>;
    if (!input.title || !input.area) {
      throw new ApiError(422, 'An activity needs a title and a development area');
    }
    const created: Activity = {
      id: nextId('act'),
      title: input.title,
      description: input.description ?? '',
      area: input.area,
      ageRange: input.ageRange ?? '6-9',
      estimatedMinutes: input.estimatedMinutes ?? 5,
      authorId: user.id,
      createdAt: new Date().toISOString(),
      steps: input.steps ?? [],
    };
    store.activities = [created, ...store.activities];
    return created;
  }

  if (method === 'GET' && activityId) {
    const activity = store.activities.find((candidate) => candidate.id === activityId);
    if (!activity) throw new ApiError(404, `Activity ${activityId} not found`);
    return activity;
  }

  throw new ApiError(404, `Unhandled activities route: ${method}`);
}

function handleAssignments(
  method: HttpMethod,
  segments: string[],
  query: QueryBag,
  body: unknown,
): unknown {
  const assignmentId = segments[1];
  const sub = segments[2];
  const user = currentUser();

  if (method === 'GET' && !assignmentId) {
    const visibleIds = new Set(visibleStudentsFor(user).map((student) => student.id));
    let assignments = store.assignments.filter((assignment) =>
      visibleIds.has(assignment.studentId),
    );
    if (query.studentId) {
      assignments = assignments.filter((a) => a.studentId === query.studentId);
    }
    if (query.status) assignments = assignments.filter((a) => a.status === query.status);
    if (query.dueOn) assignments = assignments.filter((a) => a.dueOn === query.dueOn);
    return assignments.sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  }

  if (method === 'POST' && !assignmentId) {
    const input = body as { activityId?: string; studentId?: string; dueOn?: string };
    if (!input.activityId || !input.studentId) {
      throw new ApiError(422, 'An assignment needs an activity and a student');
    }
    const activity = store.activities.find((candidate) => candidate.id === input.activityId);
    const created: Assignment = {
      id: nextId('asg'),
      activityId: input.activityId,
      studentId: input.studentId,
      assignedById: user.id,
      assignedByName: user.name,
      assignedAt: new Date().toISOString(),
      dueOn: input.dueOn ?? new Date().toISOString().slice(0, 10),
      status: 'assigned',
      // Ten XP a minute: longer activities are worth more.
      xp: (activity?.estimatedMinutes ?? 5) * 10,
    };
    store.assignments = [...store.assignments, created];
    return created;
  }

  if (method === 'POST' && assignmentId && sub === 'complete') {
    const index = store.assignments.findIndex((candidate) => candidate.id === assignmentId);
    if (index === -1) throw new ApiError(404, `Assignment ${assignmentId} not found`);
    const existing = store.assignments[index]!;
    const { responses } = (body ?? {}) as { responses?: Assignment['responses'] };
    const updated: Assignment = {
      ...existing,
      status: 'completed',
      completedAt: new Date().toISOString(),
      ...(responses ? { responses } : {}),
    };
    store.assignments[index] = updated;
    // Doing an activity again is welcome, but it only earns XP the first time.
    if (existing.status !== 'completed') awardXp(existing.studentId, existing.xp);
    return updated;
  }

  throw new ApiError(404, `Unhandled assignments route: ${method}`);
}

function handleClasses(
  method: HttpMethod,
  segments: string[],
  query: QueryBag,
  body: unknown,
): unknown {
  const classId = segments[1];
  const user = currentUser();

  if (method === 'GET' && !classId) {
    let classes = store.classes;
    const schoolId = query.schoolId ?? user.schoolId ?? undefined;
    if (schoolId && user.role !== 'platform-admin') {
      classes = classes.filter((group) => group.schoolId === schoolId);
    }
    if (query.teacherId) classes = classes.filter((c) => c.teacherId === query.teacherId);
    return [...classes].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (method === 'POST' && !classId) {
    const input = body as Partial<ClassGroup>;
    if (!input.name) throw new ApiError(422, 'A class needs a name');
    const created: ClassGroup = {
      id: nextId('cls'),
      name: input.name,
      schoolId: input.schoolId ?? user.schoolId ?? 'sch-ridgeview',
      yearLevel: input.yearLevel ?? '',
      teacherId: input.teacherId ?? '',
      studentIds: input.studentIds ?? [],
    };
    store.classes = [...store.classes, created];
    return created;
  }

  if (!classId) throw new ApiError(404, 'Unhandled classes route');

  if (method === 'PATCH') {
    const index = store.classes.findIndex((candidate) => candidate.id === classId);
    if (index === -1) throw new ApiError(404, `Class ${classId} not found`);
    const existing = store.classes[index]!;
    const updated = { ...existing, ...(body as Partial<ClassGroup>), id: existing.id };
    store.classes[index] = updated;
    return updated;
  }

  if (method === 'DELETE') {
    store.classes = store.classes.filter((candidate) => candidate.id !== classId);
    return undefined;
  }

  throw new ApiError(404, `Unhandled classes route: ${method}`);
}

function handleUsers(
  method: HttpMethod,
  segments: string[],
  query: QueryBag,
  body: unknown,
): unknown {
  const userId = segments[1];
  const user = currentUser();

  if (method === 'GET' && !userId) {
    let users = store.users;
    if (user.role === 'school-admin') {
      users = users.filter((candidate) => candidate.schoolId === user.schoolId);
    }
    if (query.role) users = users.filter((candidate) => candidate.role === query.role);
    if (query.schoolId) users = users.filter((candidate) => candidate.schoolId === query.schoolId);
    if (query.search) {
      const needle = query.search.toLowerCase();
      users = users.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(needle) ||
          candidate.email.toLowerCase().includes(needle),
      );
    }
    return [...users].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (method === 'POST' && !userId) {
    const input = body as Partial<User>;
    if (!input.name || !input.email || !input.role) {
      throw new ApiError(422, 'A user needs a name, an email address and a role');
    }
    if (store.users.some((candidate) => candidate.email === input.email)) {
      throw new ApiError(409, 'That email address is already in use');
    }
    const created: User = {
      id: nextId('usr'),
      name: input.name,
      email: input.email,
      role: input.role,
      schoolId: input.schoolId ?? user.schoolId,
      linkedStudentIds: input.linkedStudentIds ?? [],
    };
    store.users = [...store.users, created];
    return created;
  }

  if (!userId) throw new ApiError(404, 'Unhandled users route');

  if (method === 'GET') {
    const found = store.users.find((candidate) => candidate.id === userId);
    if (!found) throw new ApiError(404, `User ${userId} not found`);
    return found;
  }

  if (method === 'PATCH') {
    const index = store.users.findIndex((candidate) => candidate.id === userId);
    if (index === -1) throw new ApiError(404, `User ${userId} not found`);
    const existing = store.users[index]!;
    const updated = { ...existing, ...(body as Partial<User>), id: existing.id };
    store.users[index] = updated;
    return updated;
  }

  if (method === 'DELETE') {
    store.users = store.users.filter((candidate) => candidate.id !== userId);
    return undefined;
  }

  throw new ApiError(404, `Unhandled users route: ${method}`);
}

function handleSchools(method: HttpMethod, segments: string[], body: unknown): unknown {
  const schoolId = segments[1];
  currentUser();

  if (method === 'GET' && !schoolId) {
    return [...store.schools].sort((a, b) => a.name.localeCompare(b.name));
  }

  if (method === 'POST' && !schoolId) {
    const input = body as Partial<School>;
    if (!input.name) throw new ApiError(422, 'A school needs a name');
    const created: School = {
      id: nextId('sch'),
      name: input.name,
      city: input.city ?? '',
      studentCount: 0,
      teacherCount: 0,
      createdAt: new Date().toISOString(),
    };
    store.schools = [...store.schools, created];
    return created;
  }

  if (!schoolId) throw new ApiError(404, 'Unhandled schools route');

  if (method === 'GET') {
    const found = store.schools.find((candidate) => candidate.id === schoolId);
    if (!found) throw new ApiError(404, `School ${schoolId} not found`);
    return found;
  }

  if (method === 'PATCH') {
    const index = store.schools.findIndex((candidate) => candidate.id === schoolId);
    if (index === -1) throw new ApiError(404, `School ${schoolId} not found`);
    const existing = store.schools[index]!;
    const updated = { ...existing, ...(body as Partial<School>), id: existing.id };
    store.schools[index] = updated;
    return updated;
  }

  if (method === 'DELETE') {
    store.schools = store.schools.filter((candidate) => candidate.id !== schoolId);
    return undefined;
  }

  throw new ApiError(404, `Unhandled schools route: ${method}`);
}

export async function handleMockRequest<T>(
  method: HttpMethod,
  path: string,
  options: RequestOptions,
): Promise<T> {
  await delay();

  const segments = path.split('/').filter(Boolean);
  const resource = segments[0];
  const query = normaliseQuery(options.query);

  switch (resource) {
    case 'auth':
      return handleAuth(method, segments, options.body) as T;
    case 'students':
      return handleStudents(method, segments, query, options.body) as T;
    case 'observations':
      return handleObservations(method, segments, query, options.body) as T;
    case 'activities':
      return handleActivities(method, segments, query, options.body) as T;
    case 'assignments':
      return handleAssignments(method, segments, query, options.body) as T;
    case 'classes':
      return handleClasses(method, segments, query, options.body) as T;
    case 'users':
      return handleUsers(method, segments, query, options.body) as T;
    case 'schools':
      return handleSchools(method, segments, options.body) as T;
    default:
      throw new ApiError(404, `No mock handler for ${method} ${path}`);
  }
}
