// A local date like "2026-11-02"; as a string it never shifts with time zones
export type IsoDate = string;
// A time of day like "07:25"
export type ClockTime = string;
// 1 = Monday … 7 = Sunday
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

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

export function toISODate(date: Date): IsoDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseISODate(value: IsoDate): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function today(): IsoDate {
  return toISODate(new Date());
}

export function addDays(value: IsoDate, days: number): IsoDate {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function isoWeekday(value: IsoDate): Weekday {
  return (parseISODate(value).getDay() || 7) as Weekday;
}

export function weekdayName(weekday: number): string {
  return WEEKDAYS_LONG[weekday % 7];
}

export function weekdayShort(weekday: number): string {
  return WEEKDAYS_SHORT[weekday % 7];
}

export function formatDate(value: IsoDate): string {
  const date = parseISODate(value);
  return `${WEEKDAYS_SHORT[date.getDay()]}, ${date.getDate()}. ${MONTHS_SHORT[date.getMonth()]}`;
}

export function relativeDay(value: IsoDate, from: IsoDate): string {
  const days = daysBetween(from, value);
  if (days === 0) return "heute";
  if (days === 1) return "morgen";
  if (days === -1) return "gestern";
  return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
}

// Minutes since midnight; all arithmetic on clock times goes through them
export function minutesOf(time: ClockTime): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): ClockTime {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

export function dateAt(value: IsoDate, minutes: number): Date {
  const result = parseISODate(value);
  result.setHours(0, minutes, 0, 0);
  return result;
}

export function timeToDate(value: ClockTime): Date {
  return dateAt(today(), minutesOf(value));
}

export function dateToTime(date: Date): ClockTime {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const MINUTES_PER_DAY = 24 * 60;

// Wraps around midnight like a clock
export function addMinutes(time: ClockTime, minutes: number): ClockTime {
  const wrapped = (minutesOf(time) + minutes) % MINUTES_PER_DAY;
  return minutesToTime((wrapped + MINUTES_PER_DAY) % MINUTES_PER_DAY);
}
