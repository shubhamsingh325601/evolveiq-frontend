import { addDays, businessDate } from '../business-time';
import type {
  ActivityAnswer,
  ActivityContent,
  AttendanceStatus,
  BloodGroup,
  ConsentPurpose,
  DevelopmentArea,
  LearningBehaviourArea,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
  ObservationStatus,
  ObservationTone,
  ObservationWhen,
  HealthCondition,
  HonourKind,
  NoticeAudience,
  NoticeCategory,
  ReviewOutcome,
  Role,
  SupportCategory,
  SupportStatus,
} from '../types';

/**
 * Seed data for the in-memory backend: the same people and stories as the
 * backend's `npm run db:seed-demo`, so the demo accounts behave the same with
 * or without a server. Stored the way the backend stores it (one record per
 * table row); `mock-transport.ts` serialises each audience's shape from it.
 *
 * Dates are relative to when the store is built, so "today", streaks and
 * "this month" always read naturally.
 */

/** Every demo adult signs in with this password, every demo student with DEMO_PIN. */
export const DEMO_PASSWORD = 'EvolvIQ-Demo-2026';
export const DEMO_PIN = '246810';

export interface MockUser {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  studentLoginId: string | null;
  schoolId: string | null;
  /** The password or PIN. The mock compares it in plain text; the backend stores an argon2 hash. */
  secret: string;
  isActive: boolean;
  createdAt: string;
}

export interface MockSchool {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockClass {
  id: string;
  schoolId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockObservation {
  id: string;
  schoolId: string;
  studentId: string;
  authorId: string;
  authorRole: 'parent' | 'teacher';
  /** Positive ⇔ status 'celebrated': a star, never reviewed. */
  tone: ObservationTone;
  area: ObservationArea;
  description: string;
  when: ObservationWhen;
  howOften: ObservationFrequency;
  level: ObservationLevel | null;
  learningBehaviourArea: LearningBehaviourArea | null;
  status: ObservationStatus;
  reviewOutcome: ReviewOutcome | null;
  developmentArea: DevelopmentArea | null;
  teacherOnlyNote: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface MockActivity {
  id: string;
  title: string;
  content: ActivityContent;
  createdById: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockAssignment {
  id: string;
  activityId: string;
  studentId: string;
  assignedById: string;
  source: 'direct' | 'recommended';
  observationId: string | null;
  createdAt: string;
}

export interface MockCompletion {
  id: string;
  assignmentId: string;
  answer: ActivityAnswer;
  completedAt: string;
}

export interface MockConsent {
  studentId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  decidedAt: string;
}

export interface MockCheckin {
  studentId: string;
  /** YYYY-MM-DD, Asia/Kolkata. */
  day: string;
  mood: number;
  energy: number;
  sleepMinutes: number | null;
  activeMinutes: number | null;
}

export interface MockSupportPlan {
  id: string;
  studentId: string;
  createdById: string;
  category: SupportCategory;
  summary: string;
  strategies: string | null;
  status: SupportStatus;
  reviewOn: string | null;
  createdAt: string;
  closedAt: string | null;
}

export interface MockHealthProfile {
  studentId: string;
  conditions: HealthCondition[];
  bloodGroup: BloodGroup | null;
  allergies: string | null;
  medications: string | null;
  careNotes: string | null;
  emergencyName: string | null;
  emergencyRelation: string | null;
  emergencyPhone: string | null;
  updatedById: string | null;
  updatedAt: string;
}

export interface MockAttendance {
  studentId: string;
  /** YYYY-MM-DD, Asia/Kolkata. */
  day: string;
  status: AttendanceStatus;
  markedById: string;
  updatedAt: string;
}

export interface MockNotice {
  id: string;
  /** Null: a platform notice for every school. */
  schoolId: string | null;
  category: NoticeCategory;
  title: string;
  body: string | null;
  startsOn: string | null;
  location: string | null;
  phone: string | null;
  audience: NoticeAudience;
  isPinned: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockStaffReview {
  id: string;
  schoolId: string;
  staffId: string;
  reviewerId: string;
  /** YYYY-MM. */
  month: string;
  teaching: number;
  engagement: number;
  punctuality: number;
  teamwork: number;
  communication: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockHonour {
  id: string;
  schoolId: string;
  kind: HonourKind;
  /** YYYY-MM. */
  month: string;
  honoreeId: string;
  citation: string;
  awardedById: string;
  createdAt: string;
}

export interface MockState {
  users: MockUser[];
  schools: MockSchool[];
  classes: MockClass[];
  classTeachers: { classId: string; teacherId: string }[];
  /** A student is in one class at most. */
  classStudents: { classId: string; studentId: string }[];
  /** A student has one parent at most. */
  parentLinks: { studentId: string; parentId: string; createdAt: string }[];
  observations: MockObservation[];
  activities: MockActivity[];
  assignments: MockAssignment[];
  completions: MockCompletion[];
  /** Finished months' summaries, stored once and never changed: `${studentId}:${month}` → text. */
  monthlySummaries: Record<string, string>;
  /** A family's decisions; no row means not decided, which means no. */
  consents: MockConsent[];
  checkins: MockCheckin[];
  supportPlans: MockSupportPlan[];
  /** When each user last marked their notifications seen. */
  notificationSeen: Record<string, string>;
  healthProfiles: MockHealthProfile[];
  attendance: MockAttendance[];
  notices: MockNotice[];
  staffReviews: MockStaffReview[];
  honours: MockHonour[];
}

/**
 * A stable number in [0, 1) for a piece of text — the backend demo seed's own
 * function, so the demo register reads the same with or without a server.
 */
function unit(text: string): number {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return ((hash ^ (hash >>> 16)) >>> 0) / 2 ** 32;
}

const placeholderImage = (text: string, colour: string): string =>
  `https://placehold.co/320x240/${colour}/ffffff/png?text=${text}`;

export function buildSeed(now: Date = new Date()): MockState {
  const today = businessDate(now);
  /** That hour (Asia/Kolkata) on the business day `days` before today — never in the future. */
  const daysAgo = (days: number, hour = 10): string => {
    const at = new Date(`${addDays(today, -days)}T${String(hour).padStart(2, '0')}:00:00+05:30`);
    return new Date(Math.min(at.getTime(), now.getTime())).toISOString();
  };
  const created = daysAgo(120);

  const adult = (
    id: string,
    role: Role,
    fullName: string,
    email: string,
    schoolId: string | null,
  ): MockUser => ({
    id,
    role,
    fullName,
    email,
    studentLoginId: null,
    schoolId,
    secret: DEMO_PASSWORD,
    isActive: true,
    createdAt: created,
  });
  const student = (id: string, fullName: string, studentLoginId: string, schoolId: string): MockUser => ({
    id,
    role: 'student',
    fullName,
    email: null,
    studentLoginId,
    schoolId,
    secret: DEMO_PIN,
    isActive: true,
    createdAt: created,
  });

  const RIDGEVIEW = 'sch-ridgeview';
  const HALDEN = 'sch-halden';

  const users: MockUser[] = [
    adult('usr-tunde', 'platform_admin', 'Tunde Oyelaran', 'tunde@evolveiq.test', null),
    adult('usr-mehta', 'psychologist', 'Dr. Anand Mehta', 'mehta@school.test', null),
    adult('usr-clara', 'school_admin', 'Clara Fernandes', 'clara@school.test', RIDGEVIEW),
    adult('usr-farah', 'school_admin', 'Farah Khan', 'farah@halden.test', HALDEN),
    adult('usr-rao', 'teacher', 'Sunita Rao', 'rao@school.test', RIDGEVIEW),
    adult('usr-kapoor', 'teacher', 'Ritu Kapoor', 'ritu@school.test', RIDGEVIEW),
    adult('usr-omar', 'teacher', 'Omar Haddad', 'omar@halden.test', HALDEN),
    adult('usr-priya', 'parent', 'Priya Ahluwalia', 'priya@family.test', RIDGEVIEW),
    adult('usr-neil', 'parent', 'Neil D’Souza', 'neil@family.test', RIDGEVIEW),
    student('stu-maya', 'Maya Ahluwalia', 'RV-1001', RIDGEVIEW),
    student('stu-arjun', 'Arjun Ahluwalia', 'RV-1002', RIDGEVIEW),
    student('stu-devan', 'Devan D’Souza', 'RV-1003', RIDGEVIEW),
    student('stu-lila', 'Lila Menon', 'RV-1004', RIDGEVIEW),
    student('stu-noor', 'Noor Siddiqui', 'RV-1005', RIDGEVIEW),
    student('stu-ibrahim', 'Ibrahim Qureshi', 'RV-1006', RIDGEVIEW),
    student('stu-tara', 'Tara Bhatt', 'RV-1007', RIDGEVIEW),
    student('stu-zoe', 'Zoe Pinto', 'HG-2001', HALDEN),
    student('stu-kabir', 'Kabir Shah', 'HG-2002', HALDEN),
  ];

  const schools: MockSchool[] = [
    { id: RIDGEVIEW, name: 'Ridgeview Primary', createdAt: daysAgo(270), updatedAt: daysAgo(270) },
    { id: HALDEN, name: 'Halden Grove School', createdAt: daysAgo(220), updatedAt: daysAgo(220) },
  ];

  const group = (id: string, schoolId: string, name: string): MockClass => ({
    id,
    schoolId,
    name,
    createdAt: created,
    updatedAt: created,
  });
  const classes: MockClass[] = [
    group('cls-4b', RIDGEVIEW, '4B'),
    group('cls-3a', RIDGEVIEW, '3A'),
    group('cls-5c', RIDGEVIEW, '5C'),
    group('cls-6a', HALDEN, '6A'),
  ];

  const classTeachers = [
    { classId: 'cls-4b', teacherId: 'usr-rao' },
    { classId: 'cls-3a', teacherId: 'usr-rao' },
    { classId: 'cls-5c', teacherId: 'usr-kapoor' },
    { classId: 'cls-6a', teacherId: 'usr-omar' },
  ];
  const classStudents = [
    { classId: 'cls-4b', studentId: 'stu-maya' },
    { classId: 'cls-4b', studentId: 'stu-arjun' },
    { classId: 'cls-4b', studentId: 'stu-devan' },
    { classId: 'cls-3a', studentId: 'stu-lila' },
    { classId: 'cls-3a', studentId: 'stu-noor' },
    { classId: 'cls-5c', studentId: 'stu-ibrahim' },
    { classId: 'cls-5c', studentId: 'stu-tara' },
    { classId: 'cls-6a', studentId: 'stu-zoe' },
    { classId: 'cls-6a', studentId: 'stu-kabir' },
  ];
  const parentLinks = [
    { studentId: 'stu-maya', parentId: 'usr-priya', createdAt: created },
    { studentId: 'stu-arjun', parentId: 'usr-priya', createdAt: created },
    { studentId: 'stu-devan', parentId: 'usr-neil', createdAt: created },
  ];

  const activity = (id: string, title: string, content: ActivityContent, days: number): MockActivity => ({
    id,
    title,
    content,
    createdById: 'usr-mehta',
    archivedAt: null,
    createdAt: daysAgo(days),
    updatedAt: daysAgo(days),
  });
  const activities: MockActivity[] = [
    activity(
      'act-sorting',
      'Sort the morning',
      {
        type: 'mcq',
        prompt: 'Which one comes first in the morning?',
        options: [
          { id: 'shoes', label: 'Put on shoes' },
          { id: 'wake', label: 'Wake up' },
          { id: 'breakfast', label: 'Eat breakfast' },
          { id: 'bag', label: 'Pack the bag' },
        ],
      },
      60,
    ),
    activity(
      'act-feelings',
      'How are you feeling today?',
      {
        type: 'image_pick',
        prompt: 'Pick the picture that matches how you feel right now.',
        options: [
          { id: 'happy', label: 'Happy', imageUrl: placeholderImage('Happy', 'f59e0b') },
          { id: 'calm', label: 'Calm', imageUrl: placeholderImage('Calm', '10b981') },
          { id: 'worried', label: 'Worried', imageUrl: placeholderImage('Worried', '6366f1') },
          { id: 'cross', label: 'Cross', imageUrl: placeholderImage('Cross', 'ef4444') },
        ],
      },
      55,
    ),
    activity(
      'act-story',
      'Tell me about your day',
      { type: 'text', prompt: 'What was the best part of your day, and why?' },
      50,
    ),
    activity(
      'act-homework',
      'How tricky was homework?',
      {
        type: 'rating',
        prompt: 'How tricky did today’s homework feel? 1 is very easy, 5 is very hard.',
      },
      45,
    ),
    activity(
      'act-video',
      'Watch and tell',
      {
        type: 'media_response',
        prompt: 'Watch the flower open. What did you notice changing?',
        mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      },
      40,
    ),
  ];

  const observation = (
    fields: Pick<
      MockObservation,
      'id' | 'studentId' | 'authorId' | 'authorRole' | 'area' | 'description' | 'when' | 'howOften'
    > &
      Partial<MockObservation> & { createdDaysAgo: number },
  ): MockObservation => {
    const { createdDaysAgo, ...rest } = fields;
    return {
      schoolId: RIDGEVIEW,
      tone: 'concern',
      level: null,
      learningBehaviourArea: null,
      status: 'pending',
      reviewOutcome: null,
      developmentArea: null,
      teacherOnlyNote: null,
      reviewedById: null,
      reviewedAt: null,
      createdAt: daysAgo(createdDaysAgo, 9),
      ...rest,
    };
  };
  const reviewed = (
    days: number,
    outcome: ReviewOutcome,
    developmentArea: DevelopmentArea | null,
    teacherOnlyNote: string | null = null,
  ): Partial<MockObservation> => ({
    status: 'reviewed',
    reviewOutcome: outcome,
    developmentArea,
    teacherOnlyNote,
    reviewedById: 'usr-mehta',
    reviewedAt: daysAgo(days, 12),
  });
  /** Something good: a star on the student's profile straight away, never reviewed. */
  const celebrated: Partial<MockObservation> = { tone: 'positive', status: 'celebrated' };

  const observations: MockObservation[] = [
    // ── Concerns: what goes to the psychologist's queue ──
    observation({
      id: 'obs-reading-block',
      studentId: 'stu-maya',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'learning',
      when: 'this_week',
      howOften: 'often',
      level: 'minor',
      learningBehaviourArea: 'attention',
      description:
        'Maya drifts off during the afternoon reading block and needs two or three reminders to get back to her page.',
      createdDaysAgo: 9,
      ...reviewed(8, 'assigned', 'focus_attention', 'Try the same short task at the same time each day, and see whether the reminders drop.'),
    }),
    observation({
      id: 'obs-fire-drill',
      studentId: 'stu-devan',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'emotions',
      when: 'today',
      howOften: 'sometimes',
      level: 'significant',
      learningBehaviourArea: 'self_control',
      description:
        'Devan left the room without asking when the fire drill alarm sounded, and needed about fifteen minutes before he could come back in.',
      createdDaysAgo: 1,
    }),
    observation({
      id: 'obs-pencil',
      studentId: 'stu-noor',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'physical',
      when: 'this_week',
      howOften: 'daily',
      level: 'significant',
      learningBehaviourArea: 'task_completion',
      description:
        'Noor is still holding the pencil in a full fist grip. She tires after roughly five minutes of writing and asks to stop.',
      createdDaysAgo: 4,
    }),
    observation({
      id: 'obs-maths-worksheet',
      studentId: 'stu-lila',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'learning',
      when: 'this_month',
      howOften: 'often',
      level: 'moderate',
      learningBehaviourArea: 'task_completion',
      description:
        'Lila stops at the first tricky question on a maths worksheet and waits for help instead of trying the next one.',
      createdDaysAgo: 14,
      ...reviewed(13, 'assigned', 'learning_skills'),
    }),
    observation({
      id: 'obs-lunch-queue',
      studentId: 'stu-tara',
      authorId: 'usr-kapoor',
      authorRole: 'teacher',
      area: 'behaviour',
      when: 'this_week',
      howOften: 'sometimes',
      level: 'minor',
      learningBehaviourArea: 'self_control',
      description: 'Tara pushed ahead in the lunch queue twice this week and was upset when she was asked to go back.',
      createdDaysAgo: 8,
      ...reviewed(7, 'no_action', null, 'Worth watching, but nothing to act on yet. Tell me if it happens again.'),
    }),
    observation({
      id: 'obs-instructions',
      studentId: 'stu-ibrahim',
      authorId: 'usr-kapoor',
      authorRole: 'teacher',
      area: 'learning',
      when: 'today',
      howOften: 'often',
      level: 'significant',
      learningBehaviourArea: 'following_instructions',
      description:
        'Ibrahim could not recall the three-step instruction even straight after I gave it. This happened in both sessions today.',
      createdDaysAgo: 0,
    }),
    observation({
      id: 'obs-assembly',
      studentId: 'stu-maya',
      authorId: 'usr-priya',
      authorRole: 'parent',
      area: 'emotions',
      when: 'this_month',
      howOften: 'once',
      description:
        'Maya was so nervous before the school assembly that she asked to stay at home. Once she was there, she said she enjoyed it.',
      createdDaysAgo: 12,
      ...reviewed(11, 'assigned', 'confidence'),
    }),
    observation({
      id: 'obs-birthday',
      studentId: 'stu-maya',
      authorId: 'usr-priya',
      authorRole: 'parent',
      area: 'social',
      when: 'this_week',
      howOften: 'often',
      description:
        'At her cousin’s birthday she waited for her turn at the game twice, then got upset the third time and walked away.',
      createdDaysAgo: 3,
    }),

    // ── Something good: each one is a star ──
    observation({
      id: 'obs-tangram',
      studentId: 'stu-maya',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'learning',
      when: 'this_week',
      howOften: 'once',
      learningBehaviourArea: 'attention',
      description:
        'Maya stayed with the tangram puzzle for almost ten minutes without being prompted, which is the longest she has worked on one thing this term.',
      createdDaysAgo: 2,
      ...celebrated,
    }),
    observation({
      id: 'obs-museum-talk',
      studentId: 'stu-arjun',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'communication',
      when: 'today',
      howOften: 'once',
      learningBehaviourArea: 'participation',
      description:
        'Arjun told the class about the museum trip with a clear beginning, middle and end, and answered three questions without his notes.',
      createdDaysAgo: 0,
      ...celebrated,
    }),
    observation({
      id: 'obs-blocks',
      studentId: 'stu-lila',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'learning',
      when: 'this_month',
      howOften: 'once',
      description: 'When the block tower fell, Lila rebuilt it with a wider base without anyone suggesting it.',
      createdDaysAgo: 5,
      ...celebrated,
    }),
    observation({
      id: 'obs-new-friend',
      studentId: 'stu-noor',
      authorId: 'usr-rao',
      authorRole: 'teacher',
      area: 'social',
      when: 'today',
      howOften: 'once',
      learningBehaviourArea: 'working_with_others',
      description:
        'Noor noticed a classmate sitting alone at lunch, invited her to join the table and introduced her to everyone.',
      createdDaysAgo: 1,
      ...celebrated,
    }),
    observation({
      id: 'obs-timetable',
      studentId: 'stu-tara',
      authorId: 'usr-kapoor',
      authorRole: 'teacher',
      area: 'routines',
      when: 'this_week',
      howOften: 'daily',
      learningBehaviourArea: 'organisation',
      description:
        'Tara packed her own bag and checked the timetable herself for three days running, with no reminder from me.',
      createdDaysAgo: 6,
      ...celebrated,
    }),
    observation({
      id: 'obs-art-corner',
      studentId: 'stu-ibrahim',
      authorId: 'usr-kapoor',
      authorRole: 'teacher',
      area: 'behaviour',
      when: 'this_week',
      howOften: 'once',
      learningBehaviourArea: 'working_with_others',
      description: 'Ibrahim tidied the art corner without being asked and showed a younger pupil where the brushes go.',
      createdDaysAgo: 3,
      ...celebrated,
    }),
    observation({
      id: 'obs-dinner',
      studentId: 'stu-arjun',
      authorId: 'usr-priya',
      authorRole: 'parent',
      area: 'communication',
      when: 'today',
      howOften: 'once',
      description:
        'Arjun told the whole story of his school trip at dinner without losing track, and used words I have not heard him use before.',
      createdDaysAgo: 7,
      ...celebrated,
    }),
    observation({
      id: 'obs-uniform',
      studentId: 'stu-maya',
      authorId: 'usr-priya',
      authorRole: 'parent',
      area: 'routines',
      when: 'this_week',
      howOften: 'sometimes',
      description: 'Maya laid out her uniform and packed her school bag the night before, all on her own.',
      createdDaysAgo: 4,
      ...celebrated,
    }),
    observation({
      id: 'obs-change-of-plan',
      studentId: 'stu-devan',
      authorId: 'usr-neil',
      authorRole: 'parent',
      area: 'emotions',
      when: 'this_week',
      howOften: 'sometimes',
      description:
        'He managed the change of plan on Saturday much better than he would have a month ago. He asked what was happening instead of shutting down.',
      createdDaysAgo: 2,
      ...celebrated,
    }),
  ];

  const assignment = (
    id: string,
    studentId: string,
    activityId: string,
    assignedById: string,
    days: number,
    observationId: string | null = null,
  ): MockAssignment => ({
    id,
    activityId,
    studentId,
    assignedById,
    source: observationId ? 'recommended' : 'direct',
    observationId,
    createdAt: daysAgo(days, 8),
  });
  const assignments: MockAssignment[] = [
    // Recommended through reviews.
    assignment('asg-maya-sorting', 'stu-maya', 'act-sorting', 'usr-mehta', 8, 'obs-reading-block'),
    assignment('asg-maya-feelings', 'stu-maya', 'act-feelings', 'usr-mehta', 11, 'obs-assembly'),
    assignment('asg-lila-homework', 'stu-lila', 'act-homework', 'usr-mehta', 13, 'obs-maths-worksheet'),
    // Direct from teachers.
    assignment('asg-maya-story', 'stu-maya', 'act-story', 'usr-rao', 5),
    assignment('asg-maya-homework', 'stu-maya', 'act-homework', 'usr-rao', 4),
    assignment('asg-arjun-story', 'stu-arjun', 'act-story', 'usr-rao', 6),
    assignment('asg-devan-video', 'stu-devan', 'act-video', 'usr-rao', 3),
    assignment('asg-noor-feelings', 'stu-noor', 'act-feelings', 'usr-rao', 3),
    assignment('asg-tara-story', 'stu-tara', 'act-story', 'usr-kapoor', 5),
  ];

  const completions: MockCompletion[] = [
    { id: 'cmp-1', assignmentId: 'asg-maya-feelings', answer: { type: 'image_pick', optionId: 'happy' }, completedAt: daysAgo(2, 11) },
    {
      id: 'cmp-2',
      assignmentId: 'asg-maya-story',
      answer: { type: 'text', text: 'We built a volcano in science and it really fizzed!' },
      completedAt: daysAgo(1, 11),
    },
    {
      id: 'cmp-3',
      assignmentId: 'asg-arjun-story',
      answer: { type: 'text', text: 'Telling everyone about the museum trip.' },
      completedAt: daysAgo(0, 9),
    },
    {
      id: 'cmp-4',
      assignmentId: 'asg-tara-story',
      answer: { type: 'text', text: 'Art, because I finished my painting.' },
      completedAt: daysAgo(3, 11),
    },
  ];

  // ---------- Added with the client's feedback of 29 Oct 2026 (the backend seed's later additions) ----------

  const health = (
    studentId: string,
    updatedById: string,
    profile: Partial<Omit<MockHealthProfile, 'studentId' | 'updatedById' | 'updatedAt'>>,
  ): MockHealthProfile => ({
    studentId,
    conditions: [],
    bloodGroup: null,
    allergies: null,
    medications: null,
    careNotes: null,
    emergencyName: null,
    emergencyRelation: null,
    emergencyPhone: null,
    ...profile,
    updatedById,
    updatedAt: daysAgo(20),
  });
  const healthProfiles: MockHealthProfile[] = [
    health('stu-maya', 'usr-priya', {
      conditions: ['asthma', 'on_medication'],
      bloodGroup: 'B+',
      allergies: 'Dust and pollen',
      medications: 'Blue reliever inhaler before PE and when wheezy. It is in the front pocket of her bag.',
      careNotes: 'If she is wheezy, let her use her inhaler and sit out. Please call me if it has not settled within ten minutes.',
      emergencyName: 'Priya Ahluwalia',
      emergencyRelation: 'Mother',
      emergencyPhone: '+91 98765 43210',
    }),
    health('stu-arjun', 'usr-priya', {
      conditions: ['severe_allergy'],
      bloodGroup: 'B+',
      allergies: 'Peanuts and tree nuts (anaphylaxis)',
      medications: 'Adrenaline auto-injector, kept in the school office.',
      careNotes: 'No food sharing. If he has swelling or trouble breathing, use the auto-injector and call an ambulance (108), then me.',
      emergencyName: 'Priya Ahluwalia',
      emergencyRelation: 'Mother',
      emergencyPhone: '+91 98765 43210',
    }),
    health('stu-devan', 'usr-neil', {
      conditions: ['adhd'],
      careNotes: 'Short tasks with a movement break between them work best. A two-minute warning before a change of activity helps him a lot.',
      emergencyName: 'Neil D’Souza',
      emergencyRelation: 'Father',
      emergencyPhone: '+91 98765 43211',
    }),
    health('stu-noor', 'usr-clara', {
      conditions: ['visual_impairment'],
      careNotes: 'Wears glasses for distance. Seat her near the board and print worksheets in a larger font.',
    }),
    health('stu-ibrahim', 'usr-clara', {
      conditions: ['dyslexia'],
      careNotes: 'Give instructions one step at a time, and read written instructions aloud. Extra time in written tests.',
    }),
    health('stu-tara', 'usr-clara', {
      conditions: ['diabetes', 'on_medication'],
      bloodGroup: 'A+',
      medications: 'Insulin before lunch, given by the school nurse.',
      careNotes: 'Checks her blood sugar before lunch and PE. Glucose tablets are in the class first-aid box: give two if she feels shaky or dizzy.',
    }),
  ];

  // The last 30 days, Monday to Saturday, taken by each class's teacher.
  const usualRate: Record<string, number> = {
    'RV-1001': 0.88, 'RV-1002': 0.96, 'RV-1003': 0.72, 'RV-1004': 0.92, 'RV-1005': 0.9, 'RV-1006': 0.84, 'RV-1007': 0.94,
    'HG-2001': 0.9, 'HG-2002': 0.86,
  };
  const teacherOfClass = new Map(classTeachers.map((row) => [row.classId, row.teacherId]));
  const attendance: MockAttendance[] = [];
  for (let back = 29; back >= 0; back -= 1) {
    const day = addDays(today, -back);
    if (new Date(`${day}T00:00:00Z`).getUTCDay() === 0) continue; // Sunday
    for (const { classId, studentId } of classStudents) {
      const loginId = users.find((user) => user.id === studentId)?.studentLoginId ?? '';
      const roll = unit(`${loginId}:${day}`);
      const rate = usualRate[loginId] ?? 0.9;
      attendance.push({
        studentId,
        day,
        status: roll >= rate ? 'absent' : roll < 0.06 ? 'late' : 'present',
        markedById: teacherOfClass.get(classId) ?? 'usr-clara',
        updatedAt: daysAgo(back, 9),
      });
    }
  }

  const notice = (
    id: string,
    schoolId: string | null,
    createdById: string,
    fields: Partial<MockNotice> & Pick<MockNotice, 'category' | 'title'>,
    createdDaysAgo: number,
  ): MockNotice => ({
    id,
    schoolId,
    body: null,
    startsOn: null,
    location: null,
    phone: null,
    audience: 'everyone',
    isPinned: false,
    ...fields,
    createdById,
    createdAt: daysAgo(createdDaysAgo, 9),
    updatedAt: daysAgo(createdDaysAgo, 9),
  });
  const notices: MockNotice[] = [
    notice('ntc-sports-day', RIDGEVIEW, 'usr-clara', {
      category: 'event',
      title: 'Annual Sports Day',
      startsOn: addDays(today, 10),
      location: 'Main ground',
      isPinned: true,
      body: 'Races, relays and a tug of war for every class. Families are welcome from 9:00. Please send your child in their house colours with a water bottle.',
    }, 3),
    notice('ntc-science-fair', RIDGEVIEW, 'usr-clara', {
      category: 'activity',
      title: 'Inter-house science fair',
      startsOn: addDays(today, 20),
      location: 'Hall B',
      body: 'Projects in pairs, on anything that makes you curious. Sign up with your class teacher by Friday.',
    }, 3),
    notice('ntc-ptm', RIDGEVIEW, 'usr-clara', {
      category: 'event',
      title: 'Parent–teacher meeting',
      startsOn: addDays(today, 14),
      location: 'Classrooms',
      audience: 'families',
      body: 'Fifteen-minute conversations with your child’s class teacher. Book a slot through the school office.',
    }, 2),
    notice('ntc-first-aid', RIDGEVIEW, 'usr-clara', {
      category: 'training',
      title: 'First aid and CPR training',
      startsOn: addDays(today, 6),
      location: 'Staff room',
      audience: 'staff',
      body: 'A three-hour session with a certified trainer, for every class teacher. Bring the class first-aid box so we can restock it.',
    }, 2),
    notice('ntc-fire-drills', null, 'usr-tunde', {
      category: 'policy',
      title: 'Fire-safety drills: what changes this term',
      body: 'Every school runs two fire drills a term, marks its assembly points, and names a fire warden for each class. Your school will share its dates on this board.',
    }, 5),
    notice('ntc-safeguarding', null, 'usr-tunde', {
      category: 'policy',
      title: 'Safeguarding refresher for every staff member',
      audience: 'staff',
      body: 'Please complete the yearly safeguarding refresher this term. It covers spotting concerns, recording them and who to tell.',
    }, 5),
    notice('ntc-112', null, 'usr-tunde', { category: 'emergency_contact', title: 'National emergency number', phone: '112', body: 'Police, fire and ambulance, from any phone.' }, 6),
    notice('ntc-108', null, 'usr-tunde', { category: 'emergency_contact', title: 'Ambulance', phone: '108', body: 'Free emergency ambulance.' }, 6),
    notice('ntc-1098', null, 'usr-tunde', {
      category: 'emergency_contact',
      title: 'Childline',
      phone: '1098',
      body: 'Free, 24-hour help for children and for adults worried about a child.',
    }, 6),
  ];

  const thisMonth = today.slice(0, 7);
  const lastMonth = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1)).toISOString().slice(0, 7);
  const review = (
    id: string,
    staffId: string,
    month: string,
    ratings: [number, number, number, number, number],
    comment: string | null,
  ): MockStaffReview => ({
    id,
    schoolId: RIDGEVIEW,
    staffId,
    reviewerId: 'usr-clara',
    month,
    teaching: ratings[0],
    engagement: ratings[1],
    punctuality: ratings[2],
    teamwork: ratings[3],
    communication: ratings[4],
    comment,
    createdAt: daysAgo(4, 15),
    updatedAt: daysAgo(4, 15),
  });
  const staffReviews: MockStaffReview[] = [
    review('rev-rao-last', 'usr-rao', lastMonth, [5, 5, 4, 5, 5], 'Started the reading-buddies scheme and kept every family in the loop.'),
    review('rev-kapoor-last', 'usr-kapoor', lastMonth, [4, 4, 5, 4, 3], 'Well-run lessons. Let us find a way to share more with parents each week.'),
    review('rev-rao-now', 'usr-rao', thisMonth, [5, 4, 5, 5, 4], null),
    review('rev-kapoor-now', 'usr-kapoor', thisMonth, [4, 5, 5, 4, 4], 'The new art corner has every child in 5C talking about their work.'),
  ];

  const honour = (id: string, kind: HonourKind, month: string, honoreeId: string, citation: string): MockHonour => ({
    id,
    schoolId: RIDGEVIEW,
    kind,
    month,
    honoreeId,
    citation,
    awardedById: 'usr-clara',
    createdAt: daysAgo(3, 16),
  });
  const honours: MockHonour[] = [
    honour('hon-rao', 'staff_of_month', lastMonth, 'usr-rao',
      'For the reading-buddies scheme: every Year 3 reader now has a Year 4 buddy, and every family heard how it went.'),
    honour('hon-noor', 'student_of_month', lastMonth, 'stu-noor',
      'For kindness: Noor noticed a classmate sitting alone at lunch and made her feel at home.'),
    honour('hon-kapoor', 'staff_of_month', thisMonth, 'usr-kapoor', 'For the new art corner, where every pupil in 5C now has a piece on the wall.'),
    honour('hon-arjun', 'student_of_month', thisMonth, 'stu-arjun',
      'For telling the class about the museum trip with a clear beginning, middle and end, and answering every question.'),
  ];

  return {
    users,
    schools,
    classes,
    classTeachers,
    classStudents,
    parentLinks,
    observations,
    activities,
    assignments,
    completions,
    monthlySummaries: {},
    consents: [],
    checkins: [],
    supportPlans: [],
    notificationSeen: {},
    healthProfiles,
    attendance,
    notices,
    staffReviews,
    honours,
  };
}
