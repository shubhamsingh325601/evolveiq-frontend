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

export type ObservationStatus = 'pending' | 'reviewed';

/** "Assign & mark reviewed" / "No action needed". */
export type ReviewOutcome = 'assigned' | 'no_action';

/** What a parent wrote, and its status. Nothing clinical, by construction. */
export interface ParentObservation {
  id: string;
  studentId: string;
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
  area: ObservationArea;
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  level: ObservationLevel | null;
  learningBehaviourArea: LearningBehaviourArea | null;
  status: ObservationStatus;
  /** Null while pending. */
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
  area: ObservationArea;
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  /** Teachers only — a parent sending these is a 400. */
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
// Not served by the backend yet (see FEATURES in `features.ts`). The types stay
// for the EHI components in `@evolveiq/domain`, which are kept and tested.

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
  /** The child's year group that year, e.g. "KG" or "Year 3". */
  grade: string;
  /** The EHI at the end of that year; for the year in progress, the EHI so far. */
  score: number;
  /** True only for the year still in progress, which is always the last entry. */
  isCurrent: boolean;
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
  skills: SkillScore[];
  strengths: string[];
  playbook: string[];
  updatedAt: string;
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
