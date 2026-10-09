import type { HolisticDimension, HolisticIndex } from '@evolveiq/api-client';
import type { TrendChartPoint } from '@evolveiq/ui';

/**
 * Each pillar's chart colour, from the `ehi` set in the Tailwind preset.
 * The order matches the rings, outermost first, which is the order the set
 * was validated in.
 */
export const HOLISTIC_DIMENSION_COLOR_CLASSES: Record<HolisticDimension, string> = {
  education: 'text-ehi-education',
  skills: 'text-ehi-skills',
  physical: 'text-ehi-physical',
  wellbeing: 'text-ehi-wellbeing',
  character: 'text-ehi-character',
};

/** "Year 3" becomes "Y3"; anything else ("KG") stays as it is. */
export function shortGrade(grade: string): string {
  const match = /^Year\s+(\d+)$/i.exec(grade.trim());
  return match ? `Y${match[1]}` : grade;
}

/** How far the EHI has moved since the end of last year, or null with no last year. */
export function changeSinceLastYear(index: HolisticIndex): number | null {
  const current = index.history[index.history.length - 1];
  const previous = index.history[index.history.length - 2];
  if (!current || !previous) return null;
  return current.score - previous.score;
}

/** The school years the index has been tracked across, this one included. */
export function yearsTracked(index: HolisticIndex): number {
  return index.history.length;
}

export function trendPointsFor(index: HolisticIndex): TrendChartPoint[] {
  return index.history.map((year) => ({
    label: shortGrade(year.grade),
    value: year.score,
    detail: `${year.grade}, ${year.schoolYear}${year.isCurrent ? ' so far' : ''}`,
  }));
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** "Maya’s", "Arjun’s" — with a typographic apostrophe, as the rest of the copy. */
export function possessive(name: string): string {
  return /s$/i.test(name) ? `${name}’` : `${name}’s`;
}
