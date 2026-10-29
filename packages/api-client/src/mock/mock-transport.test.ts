import { beforeEach, describe, expect, it } from 'vitest';
import { businessMonth } from '../business-time';
import { ENDPOINTS } from '../endpoints';
import type { HttpMethod } from '../http-client';
import { DEMO_PASSWORD, DEMO_PIN, handleMockRequest, resetMockStore } from './mock-transport';

/**
 * The mock stands in for evolveiq-backend in the demo and in every app test,
 * so it has to keep the backend's rules. These check the ones screens rely on.
 */

interface Call {
  token?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(method: HttpMethod, path: string, { token, body, query }: Call = {}): Promise<{ status: number; body: any }> {
  return handleMockRequest(method, path, {
    query,
    body,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

async function signIn(credentials: { email: string } | { studentId: string }) {
  const body = 'email' in credentials ? { ...credentials, password: DEMO_PASSWORD } : { ...credentials, pin: DEMO_PIN };
  const response = await call('POST', ENDPOINTS.auth.login, { body });
  expect(response.status).toBe(200);
  return response.body as { accessToken: string; refreshToken: string; user: { id: string; role: string } };
}

const tokenFor = async (email: string) => (await signIn({ email })).accessToken;

describe('mock backend: signing in', () => {
  beforeEach(() => resetMockStore());

  it('signs adults in with an email and password, and students with their ID and PIN', async () => {
    const parent = await signIn({ email: 'PRIYA@family.test' });
    expect(parent.user).toEqual({ id: 'usr-priya', role: 'parent', fullName: 'Priya Ahluwalia', schoolId: 'sch-ridgeview' });

    const student = await signIn({ studentId: 'rv-1001' });
    expect(student.user).toMatchObject({ id: 'stu-maya', role: 'student' });
  });

  it('gives one answer for an unknown account and a wrong secret', async () => {
    for (const body of [
      { email: 'nobody@family.test', password: DEMO_PASSWORD },
      { email: 'priya@family.test', password: 'not-the-password' },
      { studentId: 'RV-1001', pin: '000000' },
    ]) {
      const response = await call('POST', ENDPOINTS.auth.login, { body });
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    }
  });

  it('rotates refresh tokens: the spent one is refused, and logout ends the session', async () => {
    const session = await signIn({ email: 'rao@school.test' });

    const renewed = await call('POST', ENDPOINTS.auth.refresh, { body: { refreshToken: session.refreshToken } });
    expect(renewed.status).toBe(200);
    expect((await call('POST', ENDPOINTS.auth.refresh, { body: { refreshToken: session.refreshToken } })).status).toBe(401);

    const logout = await call('POST', ENDPOINTS.auth.logout, {
      token: renewed.body.accessToken,
      body: { refreshToken: renewed.body.refreshToken },
    });
    expect(logout.status).toBe(204);
    expect((await call('POST', ENDPOINTS.auth.refresh, { body: { refreshToken: renewed.body.refreshToken } })).status).toBe(401);
  });

  it('refuses a deactivated account, even with a token issued before', async () => {
    const teacher = await tokenFor('ritu@school.test');
    const admin = await tokenFor('clara@school.test');

    expect((await call('POST', ENDPOINTS.users.deactivate('usr-kapoor'), { token: admin })).status).toBe(200);

    expect((await call('GET', ENDPOINTS.classes.list, { token: teacher })).status).toBe(401);
    const again = await call('POST', ENDPOINTS.auth.login, { body: { email: 'ritu@school.test', password: DEMO_PASSWORD } });
    expect(again.body.error.code).toBe('ACCOUNT_DISABLED');
  });
});

describe('mock backend: who may call what', () => {
  beforeEach(() => resetMockStore());

  it('answers 401 without a token and 403 for a role outside the route', async () => {
    expect((await call('GET', ENDPOINTS.observations.list)).status).toBe(401);

    const parent = await tokenFor('priya@family.test');
    const response = await call('GET', ENDPOINTS.observations.list, { token: parent });
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('serves a parent only what they wrote, with no clinical field on it', async () => {
    const parent = await tokenFor('priya@family.test');

    const response = await call('GET', ENDPOINTS.family.observations, { token: parent, query: { limit: 100 } });

    expect(response.body.observations.length).toBeGreaterThan(0);
    for (const observation of response.body.observations) {
      expect(Object.keys(observation).sort()).toEqual(
        ['area', 'createdAt', 'description', 'howOften', 'id', 'status', 'studentId', 'tone', 'when'],
      );
    }
  });

  it('keeps a teacher to the students of their own classes', async () => {
    const teacher = await tokenFor('rao@school.test');
    const observation = {
      area: 'learning',
      description: 'Finished the reading task early.',
      when: 'today',
      howOften: 'once',
    };

    const own = await call('POST', ENDPOINTS.observations.list, { token: teacher, body: { ...observation, studentId: 'stu-maya' } });
    expect(own.status).toBe(201);

    // Tara is in Ritu Kapoor's class, not Sunita Rao's.
    const other = await call('POST', ENDPOINTS.observations.list, { token: teacher, body: { ...observation, studentId: 'stu-tara' } });
    expect(other.status).toBe(422);
    expect((await call('GET', ENDPOINTS.students.streak('stu-tara'), { token: teacher })).status).toBe(404);
  });

  it('refuses level and learning-behaviour area from a parent', async () => {
    const parent = await tokenFor('priya@family.test');

    const response = await call('POST', ENDPOINTS.family.observations, {
      token: parent,
      body: { studentId: 'stu-maya', area: 'social', description: 'Shared her lunch.', when: 'today', howOften: 'once', level: 'minor' },
    });

    expect(response.status).toBe(400);
  });
});

describe('mock backend: review, assign, do, see', () => {
  beforeEach(() => resetMockStore());

  it('assigns the recommended activities and opens a growth area when an observation is reviewed', async () => {
    const psychologist = await tokenFor('mehta@school.test');

    const review = await call('POST', ENDPOINTS.observations.review('obs-birthday'), {
      token: psychologist,
      body: { outcome: 'assigned', developmentArea: 'social_skills', activityIds: ['act-story'] },
    });
    expect(review.status).toBe(200);
    expect(review.body.observation.review).toMatchObject({ outcome: 'assigned', activityIds: ['act-story'] });

    const assignments = await call('GET', ENDPOINTS.students.assignments('stu-maya'), { token: psychologist, query: { limit: 100 } });
    expect(assignments.body.assignments).toContainEqual(
      expect.objectContaining({ source: 'recommended', observationId: 'obs-birthday', activity: expect.objectContaining({ id: 'act-story' }) }),
    );

    const growth = await call('GET', ENDPOINTS.students.growthAreas('stu-maya'), { token: psychologist });
    expect(growth.body.growthAreas[0]).toEqual({ name: 'Friendships & social skills' });

    const again = await call('POST', ENDPOINTS.observations.review('obs-birthday'), {
      token: psychologist,
      body: { outcome: 'no_action' },
    });
    expect(again.status).toBe(409);
  });

  it('needs a development area to close a Significant observation', async () => {
    const psychologist = await tokenFor('mehta@school.test');

    const response = await call('POST', ENDPOINTS.observations.review('obs-fire-drill'), {
      token: psychologist,
      body: { outcome: 'no_action' },
    });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([{ field: 'developmentArea', message: 'is required for Significant observations' }]);
  });

  it('takes one answer per assignment, of the activity’s own type', async () => {
    const student = (await signIn({ studentId: 'RV-1001' })).accessToken;

    const wrongType = await call('POST', ENDPOINTS.activityCompletions.create, {
      token: student,
      body: { assignmentId: 'asg-maya-sorting', answer: { type: 'text', text: 'Wake up' } },
    });
    expect(wrongType.status).toBe(400);

    const done = await call('POST', ENDPOINTS.activityCompletions.create, {
      token: student,
      body: { assignmentId: 'asg-maya-sorting', answer: { type: 'mcq', optionId: 'wake' } },
    });
    expect(done.status).toBe(201);

    const twice = await call('POST', ENDPOINTS.activityCompletions.create, {
      token: student,
      body: { assignmentId: 'asg-maya-sorting', answer: { type: 'mcq', optionId: 'wake' } },
    });
    expect(twice.status).toBe(409);

    const streak = await call('GET', ENDPOINTS.students.streak('stu-maya'), { token: student });
    // Finished something the day before yesterday, yesterday and now today.
    expect(streak.body.streak.days).toBe(3);
  });

  it('shows a parent their child’s activities as done or not, with dates and never the answer', async () => {
    const parent = await tokenFor('priya@family.test');

    const response = await call('GET', ENDPOINTS.family.childAssignments('stu-maya'), { token: parent, query: { limit: 100 } });

    expect(response.status).toBe(200);
    for (const assignment of response.body.assignments) {
      expect(Object.keys(assignment).sort()).toEqual(['assignedAt', 'completedAt', 'id', 'isDone', 'title']);
    }
    expect((await call('GET', ENDPOINTS.family.childAssignments('stu-devan'), { token: parent })).status).toBe(404);
  });

  it('writes this month’s summary in plain language, live', async () => {
    const parent = await tokenFor('priya@family.test');
    const month = businessMonth();

    const response = await call('GET', ENDPOINTS.students.monthlySummary('stu-arjun', month), { token: parent });

    expect(response.status).toBe(200);
    expect(response.body.summary).toMatchObject({ studentId: 'stu-arjun', month, isFinal: false });
    expect(response.body.summary.text).toContain('Arjun Ahluwalia');
    // His teacher's praise today is a star, not something to work on.
    expect(response.body.summary.text).toMatch(/Arjun Ahluwalia has earned \d+ stars? this month\./);
    expect(response.body.summary.text).not.toContain('working on');
  });
});

describe('mock backend: something good is a star', () => {
  beforeEach(() => resetMockStore());

  const praise = {
    studentId: 'stu-arjun',
    tone: 'positive',
    area: 'communication',
    description: 'Actively communicating, fluent in language.',
    when: 'today',
    howOften: 'often',
  };

  it('celebrates a teacher’s positive observation at once and gives the student a star', async () => {
    const teacher = await tokenFor('rao@school.test');

    const created = await call('POST', ENDPOINTS.observations.list, {
      token: teacher,
      body: { ...praise, learningBehaviourArea: 'participation' },
    });
    expect(created.status).toBe(201);
    expect(created.body.observation).toMatchObject({ tone: 'positive', status: 'celebrated', level: null });

    // The student, their parent and their teacher all see it, newest first.
    const student = (await signIn({ studentId: 'RV-1002' })).accessToken;
    for (const token of [student, await tokenFor('priya@family.test'), teacher]) {
      const stars = await call('GET', ENDPOINTS.students.stars('stu-arjun'), { token, query: { limit: 100 } });
      expect(stars.status).toBe(200);
      expect(stars.body.stars[0]).toEqual({
        id: created.body.observation.id,
        studentId: 'stu-arjun',
        area: 'communication',
        description: 'Actively communicating, fluent in language.',
        givenBy: { fullName: 'Sunita Rao', role: 'teacher' },
        createdAt: created.body.observation.createdAt,
      });
    }
    // Another family's parent does not.
    expect((await call('GET', ENDPOINTS.students.stars('stu-arjun'), { token: await tokenFor('neil@family.test') })).status).toBe(404);
  });

  it('never queues a star for review, never reviews it and never makes it a growth area', async () => {
    const teacher = await tokenFor('rao@school.test');
    const psychologist = await tokenFor('mehta@school.test');
    const id = (await call('POST', ENDPOINTS.observations.list, { token: teacher, body: praise })).body.observation.id;

    for (const query of [{ status: 'pending' }, { tone: 'concern' }]) {
      const queue = await call('GET', ENDPOINTS.observations.list, { token: psychologist, query: { ...query, limit: 100 } });
      expect(queue.body.observations.map((o: { id: string }) => o.id)).not.toContain(id);
    }

    const review = await call('POST', ENDPOINTS.observations.review(id), {
      token: psychologist,
      body: { outcome: 'assigned', developmentArea: 'communication', activityIds: ['act-story'] },
    });
    expect(review.status).toBe(409);
    expect(review.body.error.message).toBe('Positive observations are celebrated, not reviewed.');

    const growth = await call('GET', ENDPOINTS.students.growthAreas('stu-arjun'), { token: psychologist });
    expect(growth.body.growthAreas).toEqual([]);
  });

  it('refuses a Level on something good', async () => {
    const teacher = await tokenFor('rao@school.test');

    const response = await call('POST', ENDPOINTS.observations.list, { token: teacher, body: { ...praise, level: 'significant' } });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([{ field: 'level', message: 'is not allowed on a positive observation' }]);
  });

  it('lets a parent give a star too', async () => {
    const parent = await tokenFor('priya@family.test');

    const created = await call('POST', ENDPOINTS.family.observations, {
      token: parent,
      body: { ...praise, studentId: 'stu-maya', description: 'Read a whole chapter to her brother at bedtime.' },
    });

    expect(created.status).toBe(201);
    expect(created.body.observation).toMatchObject({ tone: 'positive', status: 'celebrated' });
    const stars = await call('GET', ENDPOINTS.students.stars('stu-maya'), { token: parent, query: { limit: 100 } });
    expect(stars.body.stars[0].givenBy).toEqual({ fullName: 'Priya Ahluwalia', role: 'parent' });
  });
});

describe('mock backend: administration', () => {
  beforeEach(() => resetMockStore());

  it('lets a school admin create a student with a PIN, who can then sign in', async () => {
    const admin = await tokenFor('clara@school.test');

    const created = await call('POST', ENDPOINTS.auth.register, {
      token: admin,
      body: { role: 'student', fullName: 'Rhea Kulkarni', studentId: 'RV-1099', pin: '135790' },
    });
    expect(created.status).toBe(201);
    expect(created.body.user).toMatchObject({ role: 'student', schoolId: 'sch-ridgeview' });

    const login = await call('POST', ENDPOINTS.auth.login, { body: { studentId: 'RV-1099', pin: '135790' } });
    expect(login.status).toBe(200);

    const duplicate = await call('POST', ENDPOINTS.auth.register, {
      token: admin,
      body: { role: 'student', fullName: 'Someone Else', studentId: 'rv-1099', pin: '135790' },
    });
    expect(duplicate.status).toBe(409);
  });

  it('keeps a student to one class: moving them means leaving the old class first', async () => {
    const admin = await tokenFor('clara@school.test');

    expect((await call('PUT', ENDPOINTS.classes.student('cls-3a', 'stu-maya'), { token: admin })).status).toBe(409);
    expect((await call('DELETE', ENDPOINTS.classes.student('cls-4b', 'stu-maya'), { token: admin })).status).toBe(204);
    expect((await call('PUT', ENDPOINTS.classes.student('cls-3a', 'stu-maya'), { token: admin })).status).toBe(204);
  });

  it('lets a psychologist list every school, and anyone else only see their own', async () => {
    const psychologist = await tokenFor('mehta@school.test');
    const teacher = await tokenFor('rao@school.test');

    const list = await call('GET', ENDPOINTS.schools.list, { token: psychologist });
    expect(list.body.schools.map((school: { name: string }) => school.name)).toEqual(['Halden Grove School', 'Ridgeview Primary']);

    expect((await call('GET', ENDPOINTS.schools.list, { token: teacher })).status).toBe(403);
    expect((await call('GET', ENDPOINTS.schools.detail('sch-ridgeview'), { token: teacher })).status).toBe(200);
    expect((await call('GET', ENDPOINTS.schools.detail('sch-halden'), { token: teacher })).status).toBe(404);
  });

  it('pages every list the way the backend does', async () => {
    const platform = await tokenFor('tunde@evolveiq.test');

    const response = await call('GET', ENDPOINTS.users.list, { token: platform, query: { page: 2, limit: 5 } });

    expect(response.body.users).toHaveLength(5);
    expect(response.body.pagination).toMatchObject({ page: 2, limit: 5, hasPreviousPage: true });
    expect(response.body.pagination.total).toBeGreaterThan(10);
  });
});

describe('mock backend: the Holistic Index', () => {
  beforeEach(() => resetMockStore());

  it('gives a parent the index for their own child, and 404 for anyone else’s', async () => {
    const parent = await tokenFor('priya@family.test');
    const own = await call('GET', ENDPOINTS.students.holisticIndex('stu-maya'), { token: parent });
    expect(own.status).toBe(200);
    expect(own.body.holisticIndex.dimensions).toHaveLength(5);
    expect(own.body.holisticIndex.score).toBeGreaterThanOrEqual(0);
    expect(own.body.holisticIndex.score).toBeLessThanOrEqual(100);
    expect(own.body.holisticIndex.monthly.length).toBeGreaterThan(0);

    const other = await call('GET', ENDPOINTS.students.holisticIndex('stu-arjun'), { token: await tokenFor('neil@family.test') });
    expect(other.status).toBe(404);
  });

  it('never leaks concerns, levels or review notes to a parent', async () => {
    const parent = await tokenFor('priya@family.test');
    const index = await call('GET', ENDPOINTS.students.holisticIndex('stu-maya'), { token: parent });
    const moments = await call('GET', ENDPOINTS.students.growthMoments('stu-maya'), { token: parent });
    for (const response of [index, moments]) {
      const text = JSON.stringify(response.body);
      expect(text).not.toMatch(/concern|significant|clinical|reviewNote|developmentArea/i);
    }
  });

  it('lists growth moments newest first', async () => {
    const response = await call('GET', ENDPOINTS.students.growthMoments('stu-maya'), { token: await tokenFor('priya@family.test') });
    expect(response.status).toBe(200);
    const times = response.body.moments.map((m: { occurredAt: string }) => Date.parse(m.occurredAt));
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it('refuses a request without a token', async () => {
    expect((await call('GET', ENDPOINTS.students.holisticIndex('stu-maya'))).status).toBe(401);
  });
});

describe('mock backend: consent and wellbeing check-ins', () => {
  beforeEach(() => resetMockStore());
  const checkin = { mood: 4, energy: 3, sleepMinutes: 500 };

  it('starts with nothing allowed, and only the parent can decide', async () => {
    const parent = await tokenFor('priya@family.test');
    const before = await call('GET', ENDPOINTS.students.consents('stu-maya'), { token: parent });
    expect(before.body.consents.map((c: { granted: boolean }) => c.granted)).toEqual([false, false]);

    const student = (await signIn({ studentId: 'RV-1001' })).accessToken;
    const byStudent = await call('PUT', ENDPOINTS.students.consent('stu-maya', 'wellness_tracking'), { token: student, body: { granted: true } });
    expect(byStudent.status).toBe(403);
    const other = await call('PUT', ENDPOINTS.students.consent('stu-maya', 'wellness_tracking'), {
      token: await tokenFor('neil@family.test'),
      body: { granted: true },
    });
    expect(other.status).toBe(404);
  });

  it('refuses a check-in until tracking is allowed', async () => {
    const student = (await signIn({ studentId: 'RV-1001' })).accessToken;
    const refused = await call('POST', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: student, body: checkin });
    expect(refused.status).toBe(403);
    expect(refused.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('records one per day and replaces a second for the same day', async () => {
    const parent = await tokenFor('priya@family.test');
    const student = (await signIn({ studentId: 'RV-1001' })).accessToken;
    await call('PUT', ENDPOINTS.students.consent('stu-maya', 'wellness_tracking'), { token: parent, body: { granted: true } });
    expect((await call('POST', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: student, body: checkin })).status).toBe(201);
    await call('POST', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: parent, body: { mood: 2, energy: 2 } });

    const list = await call('GET', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: parent });
    expect(list.body.checkins).toHaveLength(1);
    expect(list.body.checkins[0]).toMatchObject({ mood: 2, energy: 2, sleepMinutes: null });
    expect(list.body.summary.averageMood).toBe(2);
  });

  it('validates ranges and days', async () => {
    const parent = await tokenFor('priya@family.test');
    await call('PUT', ENDPOINTS.students.consent('stu-maya', 'wellness_tracking'), { token: parent, body: { granted: true } });
    for (const body of [{ mood: 6, energy: 3 }, { mood: 3, energy: 0 }, { mood: 3, energy: 3, day: '2999-01-01' }, { mood: 3, energy: 3, extra: 1 }]) {
      expect((await call('POST', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: parent, body })).status).toBe(400);
    }
  });

  it('shows a teacher nothing until the family shares with the school', async () => {
    const parent = await tokenFor('priya@family.test');
    const teacher = await tokenFor('rao@school.test');
    await call('PUT', ENDPOINTS.students.consent('stu-maya', 'wellness_tracking'), { token: parent, body: { granted: true } });
    await call('POST', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: parent, body: checkin });

    const hidden = await call('GET', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: teacher });
    expect(hidden.body).toMatchObject({ isTracking: true, isSharedWithSchool: false, isVisible: false, checkins: [] });

    await call('PUT', ENDPOINTS.students.consent('stu-maya', 'wellness_sharing'), { token: parent, body: { granted: true } });
    const shared = await call('GET', ENDPOINTS.students.wellnessCheckins('stu-maya'), { token: teacher });
    expect(shared.body.isVisible).toBe(true);
    expect(shared.body.checkins).toHaveLength(1);
  });
});

describe('mock backend: support plans', () => {
  beforeEach(() => resetMockStore());
  const plan = { category: 'sensory', summary: 'Loud rooms are hard.', strategies: 'A quiet corner.' };

  it('lets staff of the student open, close and reopen a plan', async () => {
    const teacher = await tokenFor('rao@school.test');
    const created = await call('POST', ENDPOINTS.students.supportPlans('stu-maya'), { token: teacher, body: plan });
    expect(created.status).toBe(201);
    expect(created.body.plan).toMatchObject({ categoryLabel: 'Sensory needs', status: 'active' });

    const id = created.body.plan.id as string;
    const closed = await call('PATCH', ENDPOINTS.supportPlans.detail(id), { token: teacher, body: { status: 'closed' } });
    expect(closed.body.plan.closedAt).not.toBeNull();
    const reopened = await call('PATCH', ENDPOINTS.supportPlans.detail(id), { token: teacher, body: { status: 'in_review' } });
    expect(reopened.body.plan).toMatchObject({ status: 'in_review', closedAt: null });
  });

  it('is never visible to families, and not to a teacher of another school', async () => {
    const teacher = await tokenFor('rao@school.test');
    await call('POST', ENDPOINTS.students.supportPlans('stu-maya'), { token: teacher, body: plan });
    for (const token of [await tokenFor('priya@family.test'), (await signIn({ studentId: 'RV-1001' })).accessToken]) {
      expect((await call('GET', ENDPOINTS.students.supportPlans('stu-maya'), { token })).status).toBe(403);
    }
    expect((await call('GET', ENDPOINTS.students.supportPlans('stu-maya'), { token: await tokenFor('omar@halden.test') })).status).toBe(404);
  });
});

describe('mock backend: notifications', () => {
  beforeEach(() => resetMockStore());

  it('tells a parent about their child, then reads as seen', async () => {
    const parent = await tokenFor('priya@family.test');
    const feed = await call('GET', ENDPOINTS.notifications.list, { token: parent });
    expect(feed.status).toBe(200);
    expect(feed.body.unreadCount).toBeGreaterThan(0);
    expect(JSON.stringify(feed.body)).not.toMatch(/concern|review|significant/i);

    await call('POST', ENDPOINTS.notifications.seen, { token: parent, body: {} });
    expect((await call('GET', ENDPOINTS.notifications.list, { token: parent })).body.unreadCount).toBe(0);
  });

  it('is for family and staff only', async () => {
    expect((await call('GET', ENDPOINTS.notifications.list)).status).toBe(401);
    expect((await call('GET', ENDPOINTS.notifications.list, { token: await tokenFor('clara@school.test') })).status).toBe(403);
  });
});

describe('mock backend: health and care needs', () => {
  beforeEach(() => resetMockStore());

  it('the parent and the school read and write it, staff read it, and families reach only their own', async () => {
    const priya = await tokenFor('priya@family.test');
    const maya = await call('GET', ENDPOINTS.students.health('stu-maya'), { token: priya });
    expect(maya.status).toBe(200);
    expect(maya.body.health).toMatchObject({ conditions: ['asthma', 'on_medication'], emergencyContact: { relation: 'Mother' } });

    const saved = await call('PUT', ENDPOINTS.students.health('stu-maya'), { token: priya, body: { conditions: ['asthma'] } });
    expect(saved.body.health).toMatchObject({ conditions: ['asthma'], allergies: null, emergencyContact: null, updatedBy: { role: 'parent' } });

    const rao = await tokenFor('rao@school.test');
    expect((await call('GET', ENDPOINTS.students.health('stu-maya'), { token: rao })).status).toBe(200);
    expect((await call('PUT', ENDPOINTS.students.health('stu-maya'), { token: rao, body: { conditions: [] } })).status).toBe(403);
    const lila = await call('GET', ENDPOINTS.students.health('stu-lila'), { token: rao });
    expect(lila.body.health).toMatchObject({ conditions: [], updatedAt: null });

    const neil = await tokenFor('neil@family.test');
    expect((await call('GET', ENDPOINTS.students.health('stu-maya'), { token: neil })).status).toBe(404);
    const student = (await signIn({ studentId: 'RV-1001' })).accessToken;
    expect((await call('GET', ENDPOINTS.students.health('stu-maya'), { token: student })).status).toBe(403);
    expect((await call('PUT', ENDPOINTS.students.health('stu-maya'), { token: priya, body: { conditions: ['asthma', 'asthma'] } })).status).toBe(400);
  });

  it('lists the recorded profiles of a class for its teacher and the school admin', async () => {
    const rao = await tokenFor('rao@school.test');
    const fourB = await call('GET', ENDPOINTS.classes.health('cls-4b'), { token: rao });
    expect(fourB.body.profiles.map((p: { studentId: string }) => p.studentId)).toEqual(['stu-arjun', 'stu-devan', 'stu-maya']);
    expect((await call('GET', ENDPOINTS.classes.health('cls-5c'), { token: rao })).status).toBe(404);
    expect((await call('GET', ENDPOINTS.classes.health('cls-5c'), { token: await tokenFor('clara@school.test') })).status).toBe(200);
  });
});

describe('mock backend: attendance', () => {
  beforeEach(() => resetMockStore());

  it('starts with a month of registers, and a teacher takes or corrects the day', async () => {
    const rao = await tokenFor('rao@school.test');
    const month = await call('GET', ENDPOINTS.classes.attendance('cls-4b'), { token: rao });
    expect(month.status).toBe(200);
    expect(month.body.attendance.students.map((s: { id: string }) => s.id)).toEqual(['stu-arjun', 'stu-devan', 'stu-maya']);

    const today = month.body.attendance.to as string;
    const marked = await call('PUT', ENDPOINTS.classes.attendanceDay('cls-4b', today), {
      token: rao,
      body: { records: [{ studentId: 'stu-maya', status: 'absent' }] },
    });
    expect(marked.status).toBe(200);
    expect(marked.body.attendance.students.find((s: { id: string }) => s.id === 'stu-maya')).toMatchObject({ absent: 1, records: { [today]: 'absent' } });
    expect(marked.body.attendance.days).toEqual([{ day: today, markedBy: { fullName: 'Sunita Rao' }, markedAt: expect.any(String) }]);
  });

  it('keeps to the class, the past 30 days and staff', async () => {
    const rao = await tokenFor('rao@school.test');
    const ritu = await tokenFor('ritu@school.test');
    const today = (await call('GET', ENDPOINTS.classes.attendance('cls-4b'), { token: rao })).body.attendance.to as string;
    const mark = (token: string, classId: string, day: string, studentId: string) =>
      call('PUT', ENDPOINTS.classes.attendanceDay(classId, day), { token, body: { records: [{ studentId, status: 'present' }] } });
    expect((await mark(ritu, 'cls-4b', today, 'stu-maya')).status).toBe(404);
    expect((await mark(rao, 'cls-4b', today, 'stu-tara')).status).toBe(422);
    const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    expect((await mark(rao, 'cls-4b', tomorrow, 'stu-maya')).status).toBe(400);
    expect((await call('GET', ENDPOINTS.classes.attendance('cls-4b'), { token: await tokenFor('priya@family.test') })).status).toBe(403);
  });
});

describe('mock backend: the notice board', () => {
  beforeEach(() => resetMockStore());

  const titles = async (token: string) =>
    ((await call('GET', ENDPOINTS.notices.list, { token })).body.notices as { title: string }[]).map((n) => n.title);

  it('shows each person their audience, platform notices included', async () => {
    const parent = await titles(await tokenFor('priya@family.test'));
    expect(parent).toEqual(expect.arrayContaining(['Annual Sports Day', 'Parent–teacher meeting', 'Childline']));
    expect(parent).not.toContain('First aid and CPR training');
    const teacher = await titles(await tokenFor('rao@school.test'));
    expect(teacher).toEqual(expect.arrayContaining(['First aid and CPR training', 'Safeguarding refresher for every staff member']));
    expect(teacher).not.toContain('Parent–teacher meeting');
    expect(await titles(await tokenFor('omar@halden.test'))).not.toContain('Annual Sports Day');
    expect(parent[0]).toBe('Annual Sports Day');
  });

  it('lets the school admin post, edit and take down their own notices only', async () => {
    const clara = await tokenFor('clara@school.test');
    const created = await call('POST', ENDPOINTS.notices.list, { token: clara, body: { category: 'activity', title: 'Chess club' } });
    expect(created.status).toBe(201);
    expect(created.body.notice).toMatchObject({ schoolId: 'sch-ridgeview', audience: 'everyone', canManage: true });
    const id = created.body.notice.id as string;
    expect((await call('PATCH', ENDPOINTS.notices.detail(id), { token: clara, body: { isPinned: true } })).body.notice.isPinned).toBe(true);
    expect((await call('PATCH', ENDPOINTS.notices.detail('ntc-112'), { token: clara, body: { title: 'Mine' } })).status).toBe(404);
    expect((await call('POST', ENDPOINTS.notices.list, { token: clara, body: { category: 'emergency_contact', title: 'Nurse' } })).status).toBe(400);
    expect((await call('POST', ENDPOINTS.notices.list, { token: await tokenFor('rao@school.test'), body: { category: 'event', title: 'x' } })).status).toBe(403);
    expect((await call('DELETE', ENDPOINTS.notices.detail(id), { token: clara })).status).toBe(204);
  });
});

describe('mock backend: staff reviews and the celebration wall', () => {
  beforeEach(() => resetMockStore());

  it('the school admin rates teachers; a teacher reads only their own', async () => {
    const clara = await tokenFor('clara@school.test');
    const month = businessMonth();
    const saved = await call('PUT', ENDPOINTS.staffReviews.detail('usr-rao', month), {
      token: clara,
      body: { teaching: 5, engagement: 5, punctuality: 5, teamwork: 4, communication: 4 },
    });
    expect(saved.body.review).toMatchObject({ month, average: 4.6, comment: null });
    const own = await call('GET', ENDPOINTS.staffReviews.list, { token: await tokenFor('rao@school.test') });
    expect(own.body.reviews.every((r: { staff: { id: string } }) => r.staff.id === 'usr-rao')).toBe(true);
    expect((await call('GET', ENDPOINTS.staffReviews.list, { token: await tokenFor('priya@family.test') })).status).toBe(403);
    const full = { teaching: 5, engagement: 5, punctuality: 5, teamwork: 5, communication: 5 };
    expect((await call('PUT', ENDPOINTS.staffReviews.detail('usr-omar', month), { token: clara, body: full })).status).toBe(404);
  });

  it('families see the Staff of the Month and only the honours of their own children', async () => {
    const kinds = async (token: string) =>
      ((await call('GET', ENDPOINTS.honours.list, { token })).body.honours as { kind: string; honoree: { id: string } }[]).map(
        (h) => `${h.kind}:${h.honoree.id}`,
      );
    const priya = await kinds(await tokenFor('priya@family.test'));
    expect(priya).toEqual(expect.arrayContaining(['staff_of_month:usr-kapoor', 'student_of_month:stu-arjun']));
    expect(priya).not.toContain('student_of_month:stu-noor');
    expect(await kinds(await tokenFor('rao@school.test'))).toContain('student_of_month:stu-noor');

    const clara = await tokenFor('clara@school.test');
    const month = businessMonth();
    const named = await call('POST', ENDPOINTS.honours.list, {
      token: clara,
      body: { kind: 'student_of_month', month, honoreeId: 'stu-maya', citation: 'For her tangram focus.' },
    });
    expect(named.status).toBe(201);
    expect(named.body.honour.honoree).toMatchObject({ role: 'student', className: '4B' });
    const again = { kind: 'student_of_month', month, honoreeId: 'stu-maya', citation: 'Again' };
    expect((await call('POST', ENDPOINTS.honours.list, { token: clara, body: again })).status).toBe(409);
    const wrongRole = { kind: 'staff_of_month', month, honoreeId: 'stu-maya', citation: 'x' };
    expect((await call('POST', ENDPOINTS.honours.list, { token: clara, body: wrongRole })).status).toBe(422);
  });
});

describe('mock backend: imports and removals', () => {
  beforeEach(() => resetMockStore());

  it('checks every row, and creates everything only when every row is fine', async () => {
    const clara = await tokenFor('clara@school.test');
    const rows = [
      { fullName: 'Asha Rao', studentId: 'rv-2001', pin: '123456', className: '4b', parentEmail: 'neil@family.test' },
      { fullName: 'Ben Thomas', studentId: 'RV-2002', pin: '654321', className: 'Year 6' },
    ];
    const withBadRow = [...rows, { fullName: 'X', studentId: 'RV-1001', pin: '1' }];
    const bad = await call('POST', ENDPOINTS.imports.people, { token: clara, body: { role: 'student', dryRun: false, rows: withBadRow } });
    expect(bad.body.report).toMatchObject({ isValid: false, created: 0 });
    expect(bad.body.report.rows[2].problems).toEqual(['PIN must be exactly 6 digits', 'This student ID is already in use']);

    const good = await call('POST', ENDPOINTS.imports.people, { token: clara, body: { role: 'student', dryRun: false, rows } });
    expect(good.body.report).toMatchObject({ isValid: true, created: 2, newClasses: ['Year 6'] });
    expect((await call('POST', ENDPOINTS.auth.login, { body: { studentId: 'RV-2001', pin: '123456' } })).status).toBe(200);
  });

  it('removes only what has no records', async () => {
    const clara = await tokenFor('clara@school.test');
    const created = await call('POST', ENDPOINTS.auth.register, {
      token: clara,
      body: { role: 'teacher', fullName: 'New Teacher', email: 'new@school.test', password: DEMO_PASSWORD },
    });
    expect((await call('DELETE', ENDPOINTS.users.detail(created.body.user.id), { token: clara })).status).toBe(204);
    const kept = await call('DELETE', ENDPOINTS.users.detail('usr-rao'), { token: clara });
    expect(kept.status).toBe(409);
    expect(kept.body.error.code).toBe('HAS_RECORDS');
    expect((await call('DELETE', ENDPOINTS.classes.detail('cls-3a'), { token: clara })).status).toBe(204);
    const tunde = await tokenFor('tunde@evolveiq.test');
    expect((await call('DELETE', ENDPOINTS.schools.detail('sch-halden'), { token: tunde })).status).toBe(409);
  });
});
