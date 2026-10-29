import type {
  AttendanceStatus,
  AttendanceStudent,
  BloodGroup,
  HealthCondition,
  HonourKind,
  NoticeAudience,
  NoticeCategory,
  Role,
  StaffRatings,
} from '@evolveiq/api-client';

/**
 * The vocabulary of what came with the client's feedback of 29 Oct 2026:
 * health and care needs, attendance, the notice board, staff reviews and the
 * celebration wall. The backend stores the keys; these are the words.
 */

/** In the client's own words where they gave them ("Diabetic", "Specially abled"…). */
export const HEALTH_CONDITION_LABELS: Record<HealthCondition, string> = {
  diabetes: 'Diabetes',
  asthma: 'Asthma',
  epilepsy: 'Epilepsy / seizures',
  severe_allergy: 'Severe allergy',
  on_medication: 'On medication',
  specially_abled: 'Specially abled',
  visual_impairment: 'Visually impaired',
  hearing_impairment: 'Hearing impaired',
  dyslexia: 'Dyslexia',
  adhd: 'ADHD',
  autism: 'Autism',
  speech_language: 'Speech and language',
  other: 'Other',
};

export const HEALTH_CONDITIONS = Object.keys(HEALTH_CONDITION_LABELS) as HealthCondition[];

/** Who changed a record, in a word: "Priya Ahluwalia (parent)". */
export const ROLE_WORDS: Record<Role, string> = {
  student: 'student',
  parent: 'parent',
  teacher: 'teacher',
  psychologist: 'counsellor',
  school_admin: 'school office',
  platform_admin: 'EvolvIQ',
};

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Present',
  late: 'Late',
  absent: 'Absent',
};

export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[];

/** Below this share of days in, a child's attendance is flagged (the usual 75% rule). */
export const ATTENDANCE_WATCH_THRESHOLD = 0.75;

/** Days in (present or late) out of the days the register was taken. */
export function attendanceSummary(student: Pick<AttendanceStudent, 'present' | 'late' | 'absent'> | undefined) {
  const attended = (student?.present ?? 0) + (student?.late ?? 0);
  const recorded = attended + (student?.absent ?? 0);
  return { attended, recorded, share: recorded === 0 ? null : attended / recorded };
}

export const NOTICE_CATEGORY_LABELS: Record<NoticeCategory, string> = {
  event: 'Event',
  activity: 'Activity',
  training: 'Training',
  policy: 'Policy and updates',
  emergency_contact: 'Emergency contact',
  general: 'Announcement',
};

/** The order the board reads in: what to call first, then what is coming up, then the rest. */
export const NOTICE_CATEGORIES: NoticeCategory[] = ['emergency_contact', 'event', 'activity', 'training', 'policy', 'general'];

export const NOTICE_AUDIENCE_LABELS: Record<NoticeAudience, string> = {
  everyone: 'Everyone',
  staff: 'Staff only',
  families: 'Families',
};

/** The five things a teacher is rated on, in the order they are asked. */
export const STAFF_RATING_LABELS: Record<keyof StaffRatings, string> = {
  teaching: 'Teaching quality',
  engagement: 'Student engagement',
  punctuality: 'Punctuality and discipline',
  teamwork: 'Teamwork',
  communication: 'Communication with parents',
};

export const STAFF_RATING_CRITERIA = Object.keys(STAFF_RATING_LABELS) as (keyof StaffRatings)[];

export const HONOUR_KIND_LABELS: Record<HonourKind, string> = {
  staff_of_month: 'Staff of the Month',
  student_of_month: 'Student of the Month',
};

/** "Sat 14 Nov" for "2026-11-14". */
export function formatDayShort(day: string): string {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${day}T00:00:00Z`),
  );
}
