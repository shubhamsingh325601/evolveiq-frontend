/**
 * Every backend path the frontend knows about, in one place.
 *
 * The backend URL and the exact paths are still to be supplied. Until then
 * `VITE_API_BASE_URL` is empty and `http-client.ts` routes these same paths to
 * the in-memory mock transport. When the real URLs arrive, correct them here
 * and nothing else in the codebase changes.
 */
export const ENDPOINTS = {
  session: {
    login: '/auth/login',
    logout: '/auth/logout',
    currentUser: '/auth/me',
  },
  students: {
    list: '/students',
    detail: (studentId: string) => `/students/${studentId}`,
    growthAreas: (studentId: string) => `/students/${studentId}/growth-areas`,
    teacherNotes: (studentId: string) => `/students/${studentId}/teacher-notes`,
    monthlySummary: (studentId: string) => `/students/${studentId}/monthly-summary`,
    streak: (studentId: string) => `/students/${studentId}/streak`,
  },
  observations: {
    list: '/observations',
    create: '/observations',
    detail: (observationId: string) => `/observations/${observationId}`,
    review: (observationId: string) => `/observations/${observationId}/review`,
  },
  activities: {
    list: '/activities',
    create: '/activities',
    detail: (activityId: string) => `/activities/${activityId}`,
  },
  assignments: {
    list: '/assignments',
    create: '/assignments',
    complete: (assignmentId: string) => `/assignments/${assignmentId}/complete`,
  },
  classes: {
    list: '/classes',
    create: '/classes',
    detail: (classId: string) => `/classes/${classId}`,
  },
  users: {
    list: '/users',
    create: '/users',
    detail: (userId: string) => `/users/${userId}`,
  },
  schools: {
    list: '/schools',
    create: '/schools',
    detail: (schoolId: string) => `/schools/${schoolId}`,
  },
} as const;
