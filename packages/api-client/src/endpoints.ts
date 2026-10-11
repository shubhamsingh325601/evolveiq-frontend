/**
 * Every backend path the frontend calls, in one place. They are relative to
 * `VITE_API_BASE_URL`, which includes the version (e.g. `/api/v1`). With the
 * variable unset, `http-client.ts` sends the same paths to the in-memory mock.
 *
 * Parent-only routes live under `/family/`, as on the backend, so a parent's
 * screen can never ask for a staff shape by mistake.
 */
const id = (value: string): string => encodeURIComponent(value);

export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    /** Admin-only account creation; there is no self sign-up. */
    register: '/auth/register',
  },
  schools: {
    list: '/schools',
    detail: (schoolId: string) => `/schools/${id(schoolId)}`,
  },
  users: {
    list: '/users',
    detail: (userId: string) => `/users/${id(userId)}`,
    deactivate: (userId: string) => `/users/${id(userId)}/deactivate`,
    reactivate: (userId: string) => `/users/${id(userId)}/reactivate`,
  },
  parentStudents: {
    list: '/parent-students',
    /** A student has at most one parent, so the link is addressed by the student. */
    detail: (studentId: string) => `/parent-students/${id(studentId)}`,
  },
  classes: {
    list: '/classes',
    detail: (classId: string) => `/classes/${id(classId)}`,
    teacher: (classId: string, teacherId: string) => `/classes/${id(classId)}/teachers/${id(teacherId)}`,
    student: (classId: string, studentId: string) => `/classes/${id(classId)}/students/${id(studentId)}`,
  },
  observations: {
    /** POST: a teacher writes one. GET: the psychologist's review queue. */
    list: '/observations',
    /** The teacher's own observations. */
    mine: '/observations/mine',
    detail: (observationId: string) => `/observations/${id(observationId)}`,
    review: (observationId: string) => `/observations/${id(observationId)}/review`,
  },
  family: {
    /** POST: a parent writes one. GET: the parent's own observations. */
    observations: '/family/observations',
    childAssignments: (studentId: string) => `/family/children/${id(studentId)}/assignments`,
  },
  activities: {
    list: '/activities',
    detail: (activityId: string) => `/activities/${id(activityId)}`,
    archive: (activityId: string) => `/activities/${id(activityId)}/archive`,
  },
  assignments: {
    /** POST: a teacher's direct assignment. */
    create: '/assignments',
    /** The student's own assignments. */
    mine: '/assignments/mine',
  },
  activityCompletions: {
    create: '/activity-completions',
  },
  students: {
    assignments: (studentId: string) => `/students/${id(studentId)}/assignments`,
    growthAreas: (studentId: string) => `/students/${id(studentId)}/growth-areas`,
    streak: (studentId: string) => `/students/${id(studentId)}/streak`,
    monthlySummary: (studentId: string, month: string) =>
      `/students/${id(studentId)}/monthly-summaries/${id(month)}`,
  },
} as const;
