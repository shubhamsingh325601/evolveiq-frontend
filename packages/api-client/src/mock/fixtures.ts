import { addDays, businessDate } from '../business-time';
import type {
  ActivityAnswer,
  ActivityContent,
  ConsentPurpose,
  DevelopmentArea,
  LearningBehaviourArea,
  ObservationArea,
  ObservationFrequency,
  ObservationLevel,
  ObservationStatus,
  ObservationTone,
  ObservationWhen,
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
  };
}
