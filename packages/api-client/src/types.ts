/**
 * Domain types shared by every app. These mirror the backend contract; when
 * the real API lands only `endpoints.ts` and `http-client.ts` change.
 */

export type Role =
  | 'student'
  | 'parent'
  | 'teacher'
  | 'psychologist'
  | 'school-admin'
  | 'platform-admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  schoolId: string | null;
  /** Students this user may see. Empty for platform admins. */
  linkedStudentIds: string[];
}

export interface School {
  id: string;
  name: string;
  city: string;
  studentCount: number;
  teacherCount: number;
  createdAt: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  schoolId: string;
  yearLevel: string;
  teacherId: string;
  studentIds: string[];
}

export interface Student {
  id: string;
  name: string;
  dateOfBirth: string;
  classId: string;
  schoolId: string;
  parentIds: string[];
  /** PRD caps this at 5. Enforced in the api-client, not per screen. */
  growthAreaIds: string[];
}

/** The eight development areas the PRD works in. */
export type DevelopmentArea =
  | 'focus-and-attention'
  | 'emotional-regulation'
  | 'social-interaction'
  | 'language-and-expression'
  | 'motor-skills'
  | 'problem-solving'
  | 'independence'
  | 'memory-and-recall';

export type LearningBehaviourArea =
  | 'engagement'
  | 'persistence'
  | 'self-direction'
  | 'collaboration'
  | 'following-instructions';

export type ObservationFrequency = 'first-time' | 'occasionally' | 'weekly' | 'daily';

export type ObservationContext = 'at-home' | 'in-class' | 'during-play' | 'during-transitions';

export type ObservationStatus = 'pending' | 'reviewed' | 'no-action-needed';

export interface Observation {
  id: string;
  studentId: string;
  authorId: string;
  authorName: string;
  authorRole: Extract<Role, 'parent' | 'teacher'>;
  area: DevelopmentArea;
  /** The person's own words. Always rendered in the serif face. */
  body: string;
  context: ObservationContext;
  frequency: ObservationFrequency;
  observedAt: string;
  createdAt: string;
  status: ObservationStatus;
  isSignificant: boolean;
  /** Teacher-only fields; absent on parent-submitted observations. */
  level?: 1 | 2 | 3 | 4 | 5;
  learningBehaviourArea?: LearningBehaviourArea;
  /** Set during psychologist review. Never sent to parent or student clients. */
  reviewedAt?: string;
  reviewedById?: string;
  taggedAreas?: DevelopmentArea[];
  teacherOnlyNote?: string;
}

export type ActivityStepKind = 'mcq' | 'text' | 'image-pick' | 'rating' | 'media-response';

export interface McqStep {
  id: string;
  kind: 'mcq';
  prompt: string;
  options: { id: string; label: string }[];
}

export interface TextStep {
  id: string;
  kind: 'text';
  prompt: string;
  placeholder?: string;
}

export interface ImagePickStep {
  id: string;
  kind: 'image-pick';
  prompt: string;
  options: { id: string; label: string; imageUrl: string }[];
}

export interface RatingStep {
  id: string;
  kind: 'rating';
  prompt: string;
  lowLabel: string;
  highLabel: string;
}

export interface MediaResponseStep {
  id: string;
  kind: 'media-response';
  prompt: string;
  mediaType: 'image' | 'audio' | 'video';
  mediaUrl: string;
  responsePrompt: string;
}

export type ActivityStep =
  | McqStep
  | TextStep
  | ImagePickStep
  | RatingStep
  | MediaResponseStep;

export interface Activity {
  id: string;
  title: string;
  /** Plain-language summary a parent can read. */
  description: string;
  area: DevelopmentArea;
  ageRange: string;
  estimatedMinutes: number;
  authorId: string;
  createdAt: string;
  steps: ActivityStep[];
}

export type AssignmentStatus = 'assigned' | 'in-progress' | 'completed';

export interface Assignment {
  id: string;
  activityId: string;
  studentId: string;
  assignedById: string;
  assignedByName: string;
  assignedAt: string;
  dueOn: string;
  status: AssignmentStatus;
  /** XP the student earns for finishing it. Set by the backend when assigned. */
  xp: number;
  completedAt?: string;
  responses?: ActivityResponse[];
}

export interface ActivityResponse {
  stepId: string;
  value: string | number | string[];
}

export interface GrowthArea {
  id: string;
  studentId: string;
  area: DevelopmentArea;
  /** Plain-language, parent-safe. Never a clinical score. */
  summary: string;
  openedAt: string;
  activitiesAssigned: number;
  activitiesCompleted: number;
}

export interface TeacherNote {
  id: string;
  studentId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface MonthlySummary {
  id: string;
  studentId: string;
  month: string;
  headline: string;
  body: string;
  activitiesCompleted: number;
  observationsLogged: number;
}

export interface StreakInfo {
  studentId: string;
  currentStreak: number;
  longestStreak: number;
  /** Most recent seven days, oldest first. */
  lastSevenDays: boolean[];
}

/** A student's place on the level ladder. XP comes from finished activities. */
export interface StudentLevel {
  studentId: string;
  level: number;
  /** A friendly name for the level, e.g. "Curious Explorer". */
  title: string;
  /** All the XP earned so far. */
  xp: number;
  /** The total XP at which the next level starts. */
  xpForNextLevel: number;
}

/**
 * The five pillars of the EvolvIQ Holistic Index, in the order they are
 * drawn: outermost ring first.
 */
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
 * The EvolvIQ Holistic Index (EHI) for one child: a 0–100 development index
 * built from observations, finished activities and participation.
 *
 * It is parent-safe by construction. It is not a clinical score, and nothing
 * here carries an observation's level, significance flag or a psychologist's
 * note, so it can be shown to parents and students as it arrives.
 */
export interface HolisticIndex {
  studentId: string;
  score: number;
  /** One per pillar, in `HolisticDimension` order. */
  dimensions: HolisticDimensionScore[];
  /** One entry per school year, oldest first. */
  history: HolisticYear[];
  /** The skill profile, drawn as a five-point radar. */
  skills: SkillScore[];
  /** Plain-language strengths, strongest first. */
  strengths: string[];
  /** The Growth Playbook: plain-language next steps for home. */
  playbook: string[];
  updatedAt: string;
}

export type ReviewQueueFilters = {
  status?: ObservationStatus;
  isSignificant?: boolean;
  authorRole?: Observation['authorRole'];
  schoolId?: string;
  studentId?: string;
};

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
