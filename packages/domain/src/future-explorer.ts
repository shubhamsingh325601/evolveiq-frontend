/**
 * Future Explorer: where a child's strengths could lead. A fixed, readable
 * catalogue keyed by the strengths the Holistic Index already names, so the
 * suggestions always trace back to something noticed about the child.
 *
 * These are ideas to explore, never predictions or advice about a career, and
 * nothing here ranks a child or closes a door.
 */

export interface Pathway {
  /** The strength this comes from, as the Holistic Index names it. */
  strength: string;
  /** Fields of work and study that use it. */
  fields: string[];
  /** Things to try this term, at home or at school. */
  tryThis: string[];
}

const CATALOGUE: Pathway[] = [
  {
    strength: 'Learning habits',
    fields: ['Research and science', 'Teaching and education', 'Engineering', 'Medicine'],
    tryThis: ['Keep a "what I found out" notebook', 'Pick a topic and make a one-page poster about it', 'Visit a library or a science centre'],
  },
  {
    strength: 'Communication',
    fields: ['Journalism and media', 'Law', 'Teaching', 'Public speaking and theatre'],
    tryThis: ['Read a short story aloud to the family', 'Join a debate, storytelling or drama club', 'Write a letter to someone you admire'],
  },
  {
    strength: 'Teamwork',
    fields: ['Sports and coaching', 'Healthcare', 'Project management', 'Community work'],
    tryThis: ['Take part in a team sport or group project', 'Plan a small family event together', 'Be the one who helps a new classmate settle in'],
  },
  {
    strength: 'Positive behaviour',
    fields: ['Leadership', 'Social work', 'Public service', 'Teaching'],
    tryThis: ['Take a small responsibility at school, such as class helper', 'Help organise a clean-up or kindness day', 'Mentor a younger child with reading'],
  },
  {
    strength: 'Emotional awareness',
    fields: ['Counselling and psychology', 'Healthcare and nursing', 'Arts and design', 'Human resources'],
    tryThis: ['Keep a feelings journal or draw how the day felt', 'Talk about a book character’s feelings', 'Try a drawing, music or dance class'],
  },
  {
    strength: 'Active & healthy',
    fields: ['Sports and athletics', 'Physiotherapy and sports science', 'Outdoor and adventure work', 'Fitness coaching'],
    tryThis: ['Try a new sport for a month', 'Plan a family walk or cycle route', 'Learn a simple warm-up and teach it to a friend'],
  },
  {
    strength: 'Daily routines',
    fields: ['Operations and planning', 'Aviation and logistics', 'Accounting', 'Hospitality'],
    tryThis: ['Plan the week on a simple chart', 'Pack their own school bag for a week', 'Run a small household job from start to finish'],
  },
  {
    strength: 'Curiosity',
    fields: ['Science and technology', 'Design and invention', 'Exploration and the outdoors', 'Entrepreneurship'],
    tryThis: ['Build or fix something with an adult', 'Ask "what if" questions at dinner and test one', 'Start a small nature or collection project'],
  },
  {
    strength: 'Finishing what they start',
    fields: ['Engineering and building', 'Research', 'Craft and making', 'Software'],
    tryThis: ['Set a small project with a finish line, such as a model or a story', 'Celebrate finishing, not only winning', 'Try a long puzzle or a 30-day challenge'],
  },
];

/** How many pathways to show at once. */
export const MAX_PATHWAYS = 4;

/**
 * The pathways for a child's strengths, in the order the index lists them
 * (strongest first). A strength the catalogue does not know is skipped.
 */
export function pathwaysFor(strengths: readonly string[]): Pathway[] {
  const byStrength = new Map(CATALOGUE.map((pathway) => [pathway.strength, pathway]));
  return strengths.flatMap((strength) => byStrength.get(strength) ?? []).slice(0, MAX_PATHWAYS);
}
