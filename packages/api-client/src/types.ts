/**
 * The backend contract (evolveiq-backend, `/api/v1`), as TypeScript. Field
 * names, value lists and response shapes match the API exactly — the mock in
 * `mock/` serves the same shapes — so nothing between a hook and a screen
 * translates or invents data.
 *
 * Each audience has its own shape (a parent's observation is not a
 * psychologist's with fields hidden), the same way the backend serialises
 * them.
 */

// ───────────────────────────── People ─────────────────────────────

export type Role =
  | 'student'
  | 'parent'
  | 'teacher'
  | 'psychologist'
  | 'school_admin'
  | 'platform_admin';

/** Who is signed in, as `POST /auth/login` returns it. */
export interface SessionUser {
  id: string;
  role: Role;
  fullName: string;
  /** Null for psychologists and platform admins, who work across schools. */
  schoolId: string | null;
}

/** An account as user management (`/users`) sees it. */
export interface User {
  id: string;
  role: Role;
  fullName: string;
  /** Adults only; null for students. */
  email: string | null;
  /** Students only: the ID they sign in with. Null for adults. */
  studentId: string | null;
  schoolId: string | null;
  /** Students only: their linked parent's user ID. */
  parentId: string | null;
  isActive: boolean;
  createdAt: string;
}

/** Just enough to name someone. */
export interface Person {
  id: string;
  fullName: string;
}

/** `POST /auth/register` — accounts are created by admins, never by sign-up. */
export type NewUser =
  | {
      role: 'student';
      fullName: string;
      studentId: string;
      /** Exactly six digits. */
      pin: string;
      schoolId?: string;
      parentId?: string;
    }
  | {
      role: 'parent' | 'teacher' | 'school_admin';
      fullName: string;
      email: string;
      /** 10–128 characters. */
      password: string;
      schoolId?: string;
    }
  | {
      role: 'psychologist' | 'platform_admin';
      fullName: string;
      email: string;
      password: string;
    };

/** Adults: name and email. Students: name and student ID. Role and school never change. */
export interface UserChanges {
  fullName?: string;
  email?: string;
  studentId?: string;
}

// ───────────────────────────── Schools and classes ─────────────────────────────

export interface School {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassGroup {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

/** `GET /classes/:classId`: the class with its teachers and students. */
export interface ClassDetail {
  class: ClassGroup;
  teachers: Person[];
  students: Person[];
}

/** A parent and one of their children (`/parent-students`). */
export interface ParentStudentLink {
  parent: Person;
  student: Person;
  createdAt: string;
}

// ───────────────────────────── Observations ─────────────────────────────

/** The value lists the lead confirmed (Oct 2026); labels live in `@evolveiq/domain`. */
export type ObservationArea =
  | 'emotions'
  | 'behaviour'
  | 'social'
  | 'learning'
  | 'communication'
  | 'physical'
  | 'routines'
  | 'other';

export type ObservationWhen = 'today' | 'this_week' | 'this_month' | 'over_a_month';

export type ObservationFrequency = 'once' | 'sometimes' | 'often' | 'daily';

/** Teachers only. "Significant" is the flag the psychologist's queue filters on. */
export type ObservationLevel = 'minor' | 'moderate' | 'significant';

/** Teachers only. */
export type LearningBehaviourArea =
  | 'attention'
  | 'participation'
  | 'following_instructions'
  | 'task_completion'
  | 'organisation'
  | 'working_with_others'
  | 'self_control'
  | 'other';

/** The psychologist's review tag. Also what growth areas are named after. */
export type DevelopmentArea =
  | 'managing_feelings'
  | 'social_skills'
  | 'communication'
  | 'focus_attention'
  | 'self_control'
  | 'confidence'
  | 'resilience'
  | 'independence'
  | 'learning_skills'
  | 'motor_skills';

/**
 * Something good, or something to look into (client feedback, 21 Oct 2026). A
 * positive observation is a star for the student: celebrated straight away,
 * never reviewed, never given a Level. A concern goes to the review queue.
 */
export type ObservationTone = 'positive' | 'concern';

/** Concerns go pending → reviewed; a positive observation is celebrated from the start. */
export type ObservationStatus = 'pending' | 'reviewed' | 'celebrated';

/** "Assign & mark reviewed" / "No action needed". */
export type ReviewOutcome = 'assigned' | 'no_action';

/** What a parent wrote, and its status. Nothing clinical, by construction. */
export interface ParentObservation {
  id: string;
  studentId: string;
  tone: ObservationTone;
  area: ObservationArea;
  /** The parent's own words. Always rendered in the serif face. */
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  status: ObservationStatus;
  createdAt: string;
}

/** What a teacher wrote, its status, and the psychologist's note back to them. */
export interface TeacherObservation extends ParentObservation {
  level: ObservationLevel | null;
  learningBehaviourArea: LearningBehaviourArea | null;
  teacherOnlyNote: string | null;
  reviewedAt: string | null;
}

export interface ObservationReview {
  outcome: ReviewOutcome;
  developmentArea: DevelopmentArea | null;
  teacherOnlyNote: string | null;
  reviewedBy: Person;
  reviewedAt: string;
  /** Activities this review assigned to the student. */
  activityIds: string[];
}

/** The psychologist's full view: queue, detail and history. */
export interface ReviewObservation {
  id: string;
  schoolId: string;
  student: Person;
  author: Person & { role: 'parent' | 'teacher' };
  tone: ObservationTone;
  area: ObservationArea;
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  level: ObservationLevel | null;
  learningBehaviourArea: LearningBehaviourArea | null;
  status: ObservationStatus;
  /** Null while pending, and always for a positive observation. */
  review: ObservationReview | null;
  createdAt: string;
}

export interface ObservationDetail {
  observation: ReviewObservation;
  /** The student's other observations, newest first (up to 20). */
  history: ReviewObservation[];
}

export interface NewObservation {
  studentId: string;
  tone: ObservationTone;
  area: ObservationArea;
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  /** Teachers only — a parent sending these is a 400. Never on a positive observation (400). */
  level?: ObservationLevel;
  learningBehaviourArea?: LearningBehaviourArea;
}

/** One review closes an observation; it cannot be repeated or edited. */
export type ReviewDecision =
  | {
      outcome: 'assigned';
      /** 1–10 active activities, assigned to the student as "recommended". */
      activityIds: string[];
      /** Required when the observation is Significant. */
      developmentArea?: DevelopmentArea;
      teacherOnlyNote?: string;
    }
  | {
      outcome: 'no_action';
      developmentArea?: DevelopmentArea;
      teacherOnlyNote?: string;
    };

/** The psychologist's queue filters: Pending, Significant, From parents, Reviewed, by school. */
export interface ReviewQueueFilters {
  /** "concern" leaves the students' stars out of the queue. */
  tone?: ObservationTone;
  status?: ObservationStatus;
  level?: ObservationLevel;
  authorRole?: 'parent' | 'teacher';
  schoolId?: string;
  studentId?: string;
  area?: ObservationArea;
}

// ───────────────────────────── Activities ─────────────────────────────

export type ActivityType = 'mcq' | 'text' | 'image_pick' | 'rating' | 'media_response';

export interface McqOption {
  id: string;
  label: string;
}

export interface ImageOption {
  id: string;
  imageUrl: string;
  label?: string;
}

/** One question per activity: the five types are one discriminated union. */
export type ActivityContent =
  | { type: 'mcq'; prompt: string; options: McqOption[] }
  | { type: 'text'; prompt: string }
  | { type: 'image_pick'; prompt: string; options: ImageOption[] }
  | { type: 'rating'; prompt: string }
  | { type: 'media_response'; prompt: string; mediaUrl: string };

/** A student's answer; its `type` must match the activity's. */
export type ActivityAnswer =
  | { type: 'mcq'; optionId: string }
  | { type: 'text'; text: string }
  | { type: 'image_pick'; optionId: string }
  | { type: 'rating'; rating: number }
  | { type: 'media_response'; text: string };

/** The one global library. Archived, never deleted. */
export interface Activity {
  id: string;
  title: string;
  content: ActivityContent;
  isArchived: boolean;
  /** Assigned at least once: its type and options are frozen from then on. */
  isAssigned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NewActivity {
  title: string;
  content: ActivityContent;
}

export interface ActivityChanges {
  title?: string;
  content?: ActivityContent;
}

// ───────────────────────────── Assignments ─────────────────────────────

export interface Completion {
  answer: ActivityAnswer;
  completedAt: string;
}

/** A teacher's or psychologist's view of a student's assignment, with the answer. */
export interface StaffAssignment {
  id: string;
  studentId: string;
  activity: { id: string; title: string; type: ActivityType };
  /** Direct from a teacher, or recommended through a psychologist's review. */
  source: 'direct' | 'recommended';
  assignedBy: Person;
  observationId: string | null;
  assignedAt: string;
  completion: Completion | null;
}

/** The student's own view: the activity to do and their own answer. */
export interface StudentAssignment {
  id: string;
  activity: { id: string; title: string; content: ActivityContent };
  assignedAt: string;
  isDone: boolean;
  completion: Completion | null;
}

/** A parent's view: the activity and whether it is done. Never the answer. */
export interface FamilyAssignment {
  id: string;
  title: string;
  isDone: boolean;
  assignedAt: string;
  completedAt: string | null;
}

export interface CompletionRecord {
  id: string;
  assignmentId: string;
  answer: ActivityAnswer;
  completedAt: string;
}

// ───────────────────────────── Progress ─────────────────────────────

/** Derived from "Assign & mark reviewed" reviews: names only, never more than five. */
export interface GrowthArea {
  /** The development area's label, e.g. "Managing feelings". */
  name: string;
}

export interface Streak {
  /** Consecutive Asia/Kolkata days with at least one finished activity. */
  days: number;
}

/**
 * A star: one positive observation about a student — something good a teacher
 * or their parent noticed — in the giver's own words. The same shape for every
 * audience, and parent-safe by construction: a positive observation has no
 * Level or review, and its learning-behaviour area is never sent.
 */
export interface Star {
  /** The positive observation it was given for. */
  id: string;
  studentId: string;
  area: ObservationArea;
  /** What was noticed, as the giver wrote it. Always rendered in the serif face. */
  description: string;
  givenBy: { fullName: string; role: 'parent' | 'teacher' };
  createdAt: string;
}

export interface MonthlySummary {
  studentId: string;
  /** "YYYY-MM", an Asia/Kolkata calendar month. */
  month: string;
  /** Plain-language template text. Parent-safe for every audience. */
  text: string;
  /** True for a finished month (stored, never changes); false for the current one. */
  isFinal: boolean;
}

/**
 * A student's place on the level ladder. Worked out in the frontend from the
 * activities they have finished (see `student-level.ts`); the backend keeps no
 * XP of its own.
 */
export interface StudentLevel {
  level: number;
  /** A friendly name for the level, e.g. "Curious Explorer". */
  title: string;
  /** All the XP earned so far. */
  xp: number;
  /** The total XP at which the next level starts. */
  xpForNextLevel: number;
  completedCount: number;
}

// ───────────────────────────── EvolvIQ Holistic Index ─────────────────────────────
// Served by `GET /students/:id/holistic-index`: a documented formula over what teachers and
// parents have noticed and the activities finished (not a model). Parent-safe by construction.

/** The five pillars, in the order they are drawn: outermost ring first. */
export type HolisticDimension = 'education' | 'skills' | 'physical' | 'wellbeing' | 'character';

export interface HolisticDimensionScore {
  dimension: HolisticDimension;
  /** 0–100. */
  score: number;
}

export interface HolisticYear {
  /** e.g. "2025–26". */
  schoolYear: string;
  /** The child's year group that year, e.g. "KG" or "Year 3"; null when the platform has none on record. */
  grade: string | null;
  /** The EHI at the end of that year; for the year in progress, the EHI so far. */
  score: number;
  /** True only for the year still in progress, which is always the last entry. */
  isCurrent: boolean;
}

export interface HolisticMonth {
  /** "YYYY-MM", an Asia/Kolkata calendar month. */
  month: string;
  score: number;
}

export type HolisticTrend = 'up' | 'steady' | 'down';

/** One pillar explained: why it moved, what fed it, and one thing to try. */
export interface HolisticInsight {
  dimension: HolisticDimension;
  trend: HolisticTrend;
  title: string;
  why: string;
  factors: string[];
  action: string;
  confidence: 'low' | 'medium' | 'high';
}

export interface SkillScore {
  skill: string;
  /** 0–100. */
  score: number;
}

/**
 * The EvolvIQ Holistic Index (EHI) for one child: a 0–100 development index.
 * Parent-safe by construction: nothing here is clinical.
 */
export interface HolisticIndex {
  studentId: string;
  score: number;
  dimensions: HolisticDimensionScore[];
  history: HolisticYear[];
  /** The last six months, oldest first. */
  monthly: HolisticMonth[];
  skills: SkillScore[];
  strengths: string[];
  playbook: string[];
  insights: HolisticInsight[];
  evidence: { stars: number; activitiesCompleted: number };
  updatedAt: string;
}

/** One entry on the Growth Moments timeline: a star, a finished activity or a milestone. */
export interface GrowthMoment {
  id: string;
  kind: 'star' | 'activity' | 'milestone';
  title: string;
  /** The giver's own words for a star. */
  detail: string | null;
  area: ObservationArea | null;
  givenBy: { fullName: string; role: 'parent' | 'teacher' } | null;
  occurredAt: string;
}

// ───────────────────────────── Lists and errors ─────────────────────────────

/** The metadata every list endpoint returns beside its items. */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/** One problem with one field, from a 400. */
export interface FieldIssue {
  field: string;
  message: string;
}

/** The body of every error response. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: FieldIssue[] | Record<string, unknown>;
  };
}

// ───────────────────────────── Consent, wellbeing, support, notifications ─────────────────────────────

export type ConsentPurpose = 'wellness_tracking' | 'wellness_sharing';

/** A family's decision about one purpose. Not decided yet reads as not granted. */
export interface Consent {
  purpose: ConsentPurpose;
  label: string;
  granted: boolean;
  decidedAt: string | null;
}

/** One self-reported day. Mood and energy are 1–5. Non-clinical. */
export interface WellnessCheckin {
  /** YYYY-MM-DD, Asia/Kolkata. */
  day: string;
  mood: number;
  energy: number;
  sleepMinutes: number | null;
  activeMinutes: number | null;
}

export interface NewWellnessCheckin {
  day?: string;
  mood: number;
  energy: number;
  sleepMinutes?: number;
  activeMinutes?: number;
}

export interface WellnessSummary {
  days: number;
  averageMood: number | null;
  averageEnergy: number | null;
  averageSleepMinutes: number | null;
  averageActiveMinutes: number | null;
}

export interface WellnessCheckins {
  isTracking: boolean;
  isSharedWithSchool: boolean;
  /** False when staff ask and the family has not shared: `checkins` is then empty. */
  isVisible: boolean;
  /** Oldest first. */
  checkins: WellnessCheckin[];
  summary: WellnessSummary;
}

export type SupportCategory =
  | 'learning'
  | 'attention'
  | 'speech_language'
  | 'sensory'
  | 'physical_access'
  | 'emotional'
  | 'gifted'
  | 'other';

export type SupportStatus = 'active' | 'in_review' | 'closed';

/** A school-side support plan. Staff only: never in a parent or student response. */
export interface SupportPlan {
  id: string;
  studentId: string;
  category: SupportCategory;
  categoryLabel: string;
  summary: string;
  strategies: string | null;
  status: SupportStatus;
  statusLabel: string;
  reviewOn: string | null;
  isReviewDue: boolean;
  createdBy: { fullName: string };
  createdAt: string;
  closedAt: string | null;
}

export interface NewSupportPlan {
  category: SupportCategory;
  summary: string;
  strategies?: string;
  reviewOn?: string;
}

export interface SupportPlanChanges {
  summary?: string;
  strategies?: string | null;
  status?: SupportStatus;
  reviewOn?: string | null;
}

export interface AppNotification {
  id: string;
  kind: 'star' | 'activity_assigned' | 'activity_finished' | 'review_queue';
  title: string;
  body: string;
  studentId: string | null;
  at: string;
  isUnread: boolean;
}

export interface Notifications {
  notifications: AppNotification[];
  unreadCount: number;
}

// ───────────────────────────── Client feedback, 29 Oct 2026 ─────────────────────────────

/** What the school should know to take care of a child. Labels live in `@evolveiq/domain`. */
export type HealthCondition =
  | 'diabetes'
  | 'asthma'
  | 'epilepsy'
  | 'severe_allergy'
  | 'on_medication'
  | 'specially_abled'
  | 'visual_impairment'
  | 'hearing_impairment'
  | 'dyslexia'
  | 'adhd'
  | 'autism'
  | 'speech_language'
  | 'other';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface EmergencyContact {
  name: string;
  relation: string | null;
  phone: string;
}

/**
 * A child's health and care needs (`/students/:studentId/health`): written by
 * their parent or the school admin, read by the staff who teach or support
 * them. It is what the family tells the school, not a clinical record, and it
 * never feeds the Holistic Index.
 */
export interface HealthProfile {
  studentId: string;
  conditions: HealthCondition[];
  bloodGroup: BloodGroup | null;
  allergies: string | null;
  medications: string | null;
  careNotes: string | null;
  emergencyContact: EmergencyContact | null;
  /** Who last changed it; null if nothing is recorded yet. */
  updatedBy: { fullName: string; role: Role } | null;
  /** Null when nothing has been recorded yet. */
  updatedAt: string | null;
}

/** A write replaces the whole profile: a field left out is cleared. */
export interface HealthProfileInput {
  conditions: HealthCondition[];
  bloodGroup?: BloodGroup | null;
  allergies?: string | null;
  medications?: string | null;
  careNotes?: string | null;
  emergencyContact?: { name: string; relation?: string; phone: string } | null;
}

export type AttendanceStatus = 'present' | 'late' | 'absent';

export interface AttendanceStudent {
  id: string;
  fullName: string;
  present: number;
  late: number;
  absent: number;
  /** Day ("YYYY-MM-DD") → status, for the days recorded. */
  records: Record<string, AttendanceStatus>;
}

/** `GET /classes/:classId/attendance`: a class's register over a range of Asia/Kolkata days. */
export interface ClassAttendance {
  classId: string;
  from: string;
  to: string;
  /** Days the register was taken, oldest first. */
  days: { day: string; markedBy: { fullName: string } | null; markedAt: string }[];
  /** The class as it is today, by name. */
  students: AttendanceStudent[];
}

export interface AttendanceMark {
  studentId: string;
  status: AttendanceStatus;
}

export type NoticeCategory = 'event' | 'activity' | 'training' | 'policy' | 'emergency_contact' | 'general';
export type NoticeAudience = 'everyone' | 'staff' | 'families';

/** A notice on the board. A null school is a platform notice for every school. */
export interface Notice {
  id: string;
  schoolId: string | null;
  schoolName: string | null;
  category: NoticeCategory;
  title: string;
  body: string | null;
  /** "YYYY-MM-DD": when an event, activity or training happens. */
  startsOn: string | null;
  location: string | null;
  /** Always set on an emergency contact. */
  phone: string | null;
  audience: NoticeAudience;
  isPinned: boolean;
  createdBy: { fullName: string };
  createdAt: string;
  updatedAt: string;
  /** Whether the signed-in admin may edit or take it down. */
  canManage: boolean;
}

export interface NewNotice {
  category: NoticeCategory;
  title: string;
  body?: string;
  startsOn?: string;
  location?: string;
  phone?: string;
  audience?: NoticeAudience;
  isPinned?: boolean;
  /** Platform admins: one school, or left out for every school. */
  schoolId?: string;
}

/** null clears an optional field. */
export interface NoticeChanges {
  category?: NoticeCategory;
  title?: string;
  body?: string | null;
  startsOn?: string | null;
  location?: string | null;
  phone?: string | null;
  audience?: NoticeAudience;
  isPinned?: boolean;
}

/** The five things a school admin rates each teacher on, 1–5, once a month. */
export interface StaffRatings {
  teaching: number;
  engagement: number;
  punctuality: number;
  teamwork: number;
  communication: number;
}

export interface StaffReview {
  id: string;
  staff: Person;
  /** "YYYY-MM". */
  month: string;
  ratings: StaffRatings;
  /** Mean of the five ratings, to one decimal. */
  average: number;
  comment: string | null;
  reviewedBy: { fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface StaffReviewInput extends StaffRatings {
  comment?: string;
}

export type HonourKind = 'staff_of_month' | 'student_of_month';

/** One entry on the celebration wall. */
export interface Honour {
  id: string;
  kind: HonourKind;
  /** "YYYY-MM". */
  month: string;
  honoree: { id: string; fullName: string; role: 'teacher' | 'student'; className: string | null };
  citation: string;
  awardedBy: { fullName: string };
  createdAt: string;
}

export interface NewHonour {
  kind: HonourKind;
  month: string;
  honoreeId: string;
  citation: string;
}

export type ImportRole = 'student' | 'teacher' | 'parent';

export interface StudentImportRow {
  fullName?: string;
  studentId?: string;
  pin?: string;
  className?: string;
  parentEmail?: string;
}

export interface TeacherImportRow {
  fullName?: string;
  email?: string;
  password?: string;
  classNames?: string[];
}

export interface ParentImportRow {
  fullName?: string;
  email?: string;
  password?: string;
  childStudentIds?: string[];
}

/** `POST /imports/people`. A dry run (the default) checks only. */
export type ImportRequest = { schoolId?: string; dryRun: boolean } & (
  | { role: 'student'; rows: StudentImportRow[] }
  | { role: 'teacher'; rows: TeacherImportRow[] }
  | { role: 'parent'; rows: ParentImportRow[] }
);

export interface ImportReport {
  role: ImportRole;
  dryRun: boolean;
  /** Every row is fine. */
  isValid: boolean;
  /** Accounts created: 0 on a dry run, or when any row has a problem. */
  created: number;
  /** Classes the import creates (or would). */
  newClasses: string[];
  rows: { row: number; fullName: string; identifier: string; problems: string[] }[];
}
