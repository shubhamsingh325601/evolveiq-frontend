/**
 * Days and months are Asia/Kolkata calendar days, exactly as on the backend
 * (streaks, monthly summaries). UTC midnight is never a day boundary.
 */
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';

const DAY_PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** "YYYY-MM-DD": the business day an instant falls on. */
export function businessDate(at: Date | string = new Date()): string {
  const parts = Object.fromEntries(
    DAY_PARTS.formatToParts(new Date(at)).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** "YYYY-MM": the business month an instant falls in. */
export function businessMonth(at: Date | string = new Date()): string {
  return businessDate(at).slice(0, 7);
}

/** The day `delta` days after (or before) a "YYYY-MM-DD" day. */
export function addDays(day: string, delta: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** The month `delta` months after (or before) a "YYYY-MM" month. */
export function addMonths(month: string, delta: number): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

/**
 * The run of consecutive days with something finished, ending today — or
 * ending yesterday while today has nothing yet, so a streak is not lost before
 * the day is over. The same rule as the backend's streak.
 */
export function currentStreak(days: Iterable<string>, today: string): number {
  const done = new Set(days);
  let cursor = done.has(today) ? today : addDays(today, -1);
  let run = 0;
  while (done.has(cursor)) {
    run += 1;
    cursor = addDays(cursor, -1);
  }
  return run;
}

/** The longest run of consecutive days among `days`. */
export function longestRun(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort();
  let longest = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of sorted) {
    run = previous !== undefined && addDays(previous, 1) === day ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  return longest;
}

/** One flag per day for the seven days ending today, oldest first. */
export function lastSevenDays(days: Iterable<string>, today: string): boolean[] {
  const done = new Set(days);
  return Array.from({ length: 7 }, (_, index) => done.has(addDays(today, index - 6)));
}
