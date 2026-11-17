// Dates are handled as local ISO date strings ("2026-11-02") so they never shift with time zones.

const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const WEEKDAYS_LONG = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
const MONTHS_SHORT = [
  "Jan.",
  "Feb.",
  "März",
  "Apr.",
  "Mai",
  "Juni",
  "Juli",
  "Aug.",
  "Sept.",
  "Okt.",
  "Nov.",
  "Dez.",
];

export const SCHOOL_WEEKDAYS = [1, 2, 3, 4, 5] as const;

const pad = (value: number) => String(value).padStart(2, "0");

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function today(): string {
  return toISODate(new Date());
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetween(from: string, to: string): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

// 1 = Monday … 7 = Sunday
export function isoWeekday(value: string): number {
  return parseISODate(value).getDay() || 7;
}

export function weekdayName(weekday: number): string {
  return WEEKDAYS_LONG[weekday % 7];
}

export function weekdayShort(weekday: number): string {
  return WEEKDAYS_SHORT[weekday % 7];
}

// "Mo, 2. Nov."
export function formatDate(value: string): string {
  const date = parseISODate(value);
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()}. ${MONTHS_SHORT[date.getMonth()]}`;
}

// "heute", "morgen", "in 3 Tagen", "gestern", "vor 4 Tagen", counted from `from` (today)
export function relativeDay(value: string, from: string): string {
  const days = daysBetween(from, value);
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  if (days === -1) return "gestern";
  return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
}

// Minutes since midnight of "07:25". Times are "HH:MM" strings; all arithmetic on them goes
// through minutes.
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// "07:05" for 425 minutes since midnight
export function minutesToTime(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

// The moment `minutes` after midnight of a date (wall-clock time), for notifications
export function dateAt(value: string, minutes: number): Date {
  const result = parseISODate(value);
  result.setHours(0, minutes, 0, 0);
  return result;
}

// Today at the time, for the time pickers
export function timeToDate(value: string): Date {
  return dateAt(today(), minutesOf(value));
}

export function dateToTime(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Wraps around midnight like a clock
export function addMinutes(time: string, minutes: number): string {
  return minutesToTime((((minutesOf(time) + minutes) % 1440) + 1440) % 1440);
}
