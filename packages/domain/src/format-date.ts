const DAY_MONTH = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const MONTH_YEAR = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' });

export function formatDay(isoDate: string): string {
  const date = new Date(isoDate);
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return isThisYear ? DAY_MONTH.format(date) : DAY_MONTH_YEAR.format(date);
}

export function formatMonth(month: string): string {
  return MONTH_YEAR.format(new Date(`${month}-01T00:00:00`));
}

/** "Today", "Yesterday", then the date — how people actually refer to recent entries. */
export function formatRelativeDay(isoDate: string): string {
  const date = new Date(isoDate);
  const startOfDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const dayDifference = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / (24 * 60 * 60 * 1000),
  );

  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Yesterday';
  if (dayDifference > 1 && dayDifference < 7) return `${dayDifference} days ago`;
  return formatDay(isoDate);
}

/** The same, to finish a sentence: "Finished today", "Set 3 days ago", "Set on 12 September". */
export function relativeDayPhrase(isoDate: string): string {
  const day = formatRelativeDay(isoDate);
  if (day === 'Today' || day === 'Yesterday') return day.toLowerCase();
  return day.endsWith(' ago') ? day : `on ${day}`;
}

/** "Good morning" until noon, "Good afternoon" until six, then "Good evening". */
export function greetingFor(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
