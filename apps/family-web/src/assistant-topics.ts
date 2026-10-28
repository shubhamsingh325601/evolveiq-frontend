import {
  XP_PER_ACTIVITY,
  type FamilyAssignment,
  type HolisticIndex,
  type Person,
  type Star,
  type StudentAssignment,
  type StudentLevel,
} from '@evolveiq/api-client';
import {
  changeSinceLastYear,
  firstNameOf,
  OBSERVATION_AREA_LABELS,
  possessive,
  type AssistantSafetyReply,
  type AssistantTopic,
} from '@evolveiq/domain';

/**
 * What the EvolvIQ Guide can say, for a student and for a parent. Every answer
 * is written here in advance and filled from data the app has already loaded
 * for that person, so a parent's answers carry only what the family shapes
 * hold: never a concern, a Level or a counsellor's note.
 */

export const GUIDE_NAME = 'EvolvIQ Guide';

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** "a", "a and b", "a, b and c". */
function listOf(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// ───────────────────────────── Student ─────────────────────────────

export interface StudentGuideFacts {
  firstName: string;
  missions: StudentAssignment[];
  level: StudentLevel | undefined;
  stars: Star[];
  streakDays: number | undefined;
  holistic: HolisticIndex | undefined;
}

export const STUDENT_SAFETY: AssistantSafetyReply = {
  keywords: [
    'sad', 'upset', 'scared', 'afraid', 'frightened', 'worried', 'worry', 'worrying', 'lonely', 'hurt', 'hurting',
    'bully', 'bullied', 'bullying', 'hit me', 'unsafe', 'not safe', 'crying', 'hate myself', 'die', 'kill', 'suicide', 'abuse',
  ],
  answer:
    'Thank you for telling me. I am only a guide, so please talk to a grown-up you trust today, like your teacher, the school counsellor or someone at home. If you ever feel unsafe, tell an adult straight away.',
  link: { label: 'Tell us how you feel', to: '/student/wellbeing' },
};

export function studentGreeting(firstName: string): string {
  return `Hi ${firstName}! I'm the ${GUIDE_NAME}. Tap a question below or type your own, and I'll help you find your way.`;
}

export const STUDENT_FALLBACK =
  "I'm a simple guide, so I only know about your missions, your level, your stars, your streak and your score. Try one of the questions below!";

export function studentTopics(facts: StudentGuideFacts): AssistantTopic[] {
  const toDo = facts.missions.filter((mission) => !mission.isDone);
  const newestStar = facts.stars[0];
  const topics: AssistantTopic[] = [
    {
      id: 'today',
      question: 'What should I do today?',
      keywords: ['today', 'mission', 'missions', 'activity', 'activities', 'task', 'tasks', 'homework', 'what should i do', 'to do'],
      answer:
        toDo.length === 0
          ? 'You have finished everything for now. Great work! New missions show up on your home page when your teacher sets them.'
          : `You have ${count(toDo.length, 'mission', 'missions')} to do: ${listOf(toDo.map((mission) => mission.activity.title))}. Each one you finish is worth ${XP_PER_ACTIVITY} XP.`,
      link: { label: 'Go to my missions', to: '/student/today' },
    },
  ];

  if (facts.level) {
    const { level, title, xp, xpForNextLevel } = facts.level;
    const activitiesLeft = Math.max(1, Math.ceil((xpForNextLevel - xp) / XP_PER_ACTIVITY));
    topics.push({
      id: 'level',
      question: 'How do I level up?',
      keywords: ['level', 'level up', 'xp', 'points'],
      answer: `You are on level ${level}, ${title}, with ${xp} XP. Finish ${count(activitiesLeft, 'more activity', 'more activities')} to reach level ${level + 1}: every activity is worth ${XP_PER_ACTIVITY} XP.`,
      link: { label: 'See my progress', to: '/student/progress' },
    });
  }

  topics.push({
    id: 'stars',
    question: 'How do I get stars?',
    keywords: ['star', 'stars', 'reward', 'rewards'],
    answer: newestStar
      ? `You have ${count(facts.stars.length, 'star', 'stars')}! Stars are for good things your teacher or your family noticed. Your newest one is for ${OBSERVATION_AREA_LABELS[newestStar.area].toLowerCase()}: “${newestStar.description}”`
      : 'Stars are for good things your teacher or your family notice you doing. Keep going, and your first one will show up on your home page.',
    link: { label: 'See all my stars', to: '/student/progress' },
  });

  if (facts.holistic) {
    const strengths = facts.holistic.strengths.slice(0, 2);
    topics.push({
      id: 'score',
      question: 'What is my score?',
      keywords: ['score', 'ehi', 'holistic', 'index', 'report', 'superpower', 'superpowers', 'strengths', 'good at'],
      answer: `Your EvolvIQ score is ${facts.holistic.score} out of 100. It is about how you are growing, not a test, and it goes up as you finish activities and earn stars.${strengths.length > 0 ? ` You shine at ${listOf(strengths.map((strength) => strength.toLowerCase()))}.` : ''}`,
      link: { label: 'See my report', to: '/student/report' },
    });
  }

  if (facts.streakDays !== undefined) {
    topics.push({
      id: 'streak',
      question: 'How do I keep my streak?',
      keywords: ['streak', 'flame', 'in a row', 'every day'],
      answer:
        facts.streakDays > 0
          ? `Your streak is ${count(facts.streakDays, 'day', 'days')} in a row. Finish one activity each day to keep it going!`
          : 'Finish one activity today to start a streak, then one each day to keep it going.',
      link: { label: 'Go to my missions', to: '/student/today' },
    });
  }

  topics.push({ id: 'worry', question: 'Something is worrying me', keywords: [], answer: STUDENT_SAFETY.answer, link: STUDENT_SAFETY.link });
  return topics;
}

// ───────────────────────────── Parent ─────────────────────────────

export interface ParentGuideFacts {
  parentFirstName: string;
  /** The children, the one the parent last opened first: "my child" means them. */
  children: Person[];
  holisticByChild: Map<string, HolisticIndex | undefined>;
  starsByChild: Map<string, Star[] | undefined>;
  assignmentsByChild: Map<string, FamilyAssignment[]>;
}

export const PARENT_SAFETY: AssistantSafetyReply = {
  keywords: ['emergency', 'urgent', 'danger', 'unsafe', 'not safe', 'abuse', 'abused', 'self harm', 'suicide', 'injured'],
  answer:
    "If anyone is in danger right now, call your local emergency number. For anything urgent about your child's safety, contact the school directly: I'm only a guide and can't pass this on.",
};

export function parentGreeting(parentFirstName: string, children: Person[]): string {
  const names = listOf(children.map((child) => firstNameOf(child.fullName)));
  return children.length === 0
    ? `Hello ${parentFirstName}. I'm the ${GUIDE_NAME}. Ask me about stars, the Holistic Index, raising a concern or privacy.`
    : `Hello ${parentFirstName}. I'm the ${GUIDE_NAME}. Ask me how ${names} ${children.length === 1 ? 'is' : 'are'} doing, or about stars, the Holistic Index and privacy.`;
}

export const PARENT_FALLBACK =
  "I'm a simple guide and only know a few things: how your children are doing, stars, the Holistic Index, raising a concern, Explore and privacy. Try one of the questions below.";

export function parentTopics(facts: ParentGuideFacts): AssistantTopic[] {
  const current = facts.children[0];
  const currentName = current ? firstNameOf(current.fullName) : 'your child';

  const childTopics = facts.children.map((child): AssistantTopic => {
    const name = firstNameOf(child.fullName);
    const index = facts.holisticByChild.get(child.id);
    const stars = facts.starsByChild.get(child.id)?.length ?? 0;
    const toDo = (facts.assignmentsByChild.get(child.id) ?? []).filter((assignment) => !assignment.isDone).length;
    const change = index ? changeSinceLastYear(index) : null;
    const strengths = (index?.strengths ?? []).slice(0, 2).map((strength) => strength.toLowerCase());
    const indexLine = index
      ? `${possessive(name)} EvolvIQ Holistic Index is ${index.score}${change ? `, ${change > 0 ? 'up' : 'down'} ${Math.abs(change)} since last year` : ''}. `
      : '';
    return {
      id: `child-${child.id}`,
      question: `How is ${name} doing?`,
      keywords: [name.toLowerCase(), 'how is', 'doing', 'progress', 'getting on', 'my child', 'my son', 'my daughter'],
      answer: `${indexLine}${name} has ${count(stars, 'star', 'stars')} and ${count(toDo, 'activity', 'activities')} still to do${strengths.length > 0 ? `, and shines at ${listOf(strengths)}` : ''}.`,
      link: { label: `Open ${possessive(name)} dashboard`, to: `/parent/children/${child.id}` },
    };
  });

  const forChild = (path: string) => (current ? path.replace(':childId', current.id) : '/parent/children');
  return [
    ...childTopics,
    {
      id: 'ehi',
      question: 'What is the Holistic Index?',
      keywords: ['ehi', 'holistic', 'index', 'score', 'report', 'pillars'],
      answer:
        'The EvolvIQ Holistic Index (EHI) is a score from 0 to 100 built from five pillars: education, skills, physical, wellbeing and character. It comes from what teachers and you notice and from the activities your child finishes. It is a picture of how they are developing, not a test result and never a clinical score.',
      link: { label: 'Open the full report', to: forChild('/parent/children/:childId/report') },
    },
    {
      id: 'stars',
      question: 'How do stars work?',
      keywords: ['star', 'stars', 'reward', 'rewards', 'praise', 'celebrate'],
      answer:
        "A star is something good a teacher or you noticed, kept with the giver's own words. Your child sees their stars too. You can give one: add an observation and choose “Something to celebrate”.",
      link: { label: 'Celebrate something', to: current ? `/parent/observations/new?childId=${current.id}&tone=positive` : '/parent/observations/new' },
    },
    {
      id: 'concern',
      question: 'How do I raise a concern?',
      keywords: ['concern', 'concerned', 'problem', 'issue', 'raise', 'look into', 'struggling'],
      answer:
        'Add an observation and choose “Something to look into”. The school counsellor reads every one and decides what would help, and you will see when it has been read.',
      link: { label: 'Raise a concern', to: current ? `/parent/observations/new?childId=${current.id}&tone=concern` : '/parent/observations/new' },
    },
    {
      id: 'explore',
      question: 'What can we explore together?',
      keywords: ['explore', 'ideas', 'career', 'future', 'interests', 'hobbies', 'try'],
      answer: `Explore suggests things to try with ${currentName}, starting from what has been noticed about them rather than from a test. They are ideas, not predictions.`,
      link: { label: 'Open Explore', to: current ? `/parent/explore/${current.id}` : '/parent/explore' },
    },
    {
      id: 'privacy',
      question: 'Who can see what I write?',
      keywords: ['privacy', 'private', 'who can see', 'who sees', 'share', 'shared', 'data', 'consent'],
      answer:
        "What you write goes to the school. You see your own notes and whether they have been read, with your child's stars, activities and progress. Teachers' concerns and counsellors' notes stay with the school.",
      link: { label: 'Privacy & safety', to: '/parent/privacy' },
    },
    {
      id: 'person',
      question: 'Can I talk to a person?',
      keywords: ['person', 'human', 'talk to', 'speak', 'contact', 'call', 'meeting', 'teacher'],
      answer:
        "I'm an automated guide, not a person, and I can't pass messages on. To talk to someone about your child, contact the school office directly.",
    },
  ];
}
