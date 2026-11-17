import type { Entry, Lesson, Period, Settings, Subject } from "@/db/schema";
import { addDays, isoWeekday, parseISODate, toISODate, weekdayName } from "@/lib/dates";
import {
  type DueItem,
  dueLine,
  homeworkLine,
  secondReminderTitle,
  summaryTitle,
} from "@/lib/reminder-texts";

// Days planned ahead. iOS keeps at most 64 pending notifications per app and a day has at most
// two; the plan is renewed whenever the data changes or a new day begins in the open app.
export const REMINDER_DAYS = 21;
// The summary comes this long after the last lesson, once the student is out of school
const AFTER_SCHOOL_MINUTES = 30;
// Lines in a notification; the rest is counted as "und 2 weitere"
const MAX_LINES = 4;

export type Reminder = {
  // "summary-2026-11-17" or "second-2026-11-17"
  id: string;
  date: Date;
  title: string;
  body: string;
  // The entry a tap opens; null opens the agenda
  entryId: number | null;
};

export type ReminderData = {
  entries: Entry[];
  lessons: Lesson[];
  periods: Period[];
  subjects: Subject[];
  settings: Settings;
  now: Date;
};

// When the last lesson of a weekday ends, null on a day without lessons
function schoolEnd(weekday: number, lessons: Lesson[], periods: Period[]): string | null {
  let end: string | null = null;
  for (const lesson of lessons) {
    if (lesson.weekday !== weekday) continue;
    const period = periods.find((candidate) => candidate.id === lesson.periodId);
    if (period && (end === null || period.endTime > end)) end = period.endTime;
  }
  return end;
}

// The next day after `date` with lessons; the day after if the timetable is empty
function nextSchoolDay(date: string, lessons: Lesson[]): string {
  for (let offset = 1; offset <= 7; offset++) {
    const day = addDays(date, offset);
    if (lessons.some((lesson) => lesson.weekday === isoWeekday(day))) return day;
  }
  return addDays(date, 1);
}

function at(date: string, time: string, extraMinutes = 0): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = parseISODate(date);
  result.setHours(hours, minutes + extraMinutes, 0, 0);
  return result;
}

function joinLines(lines: string[]): string {
  if (lines.length <= MAX_LINES) return lines.join("\n");
  const shown = lines.slice(0, MAX_LINES - 1);
  return [...shown, `und ${lines.length - shown.length} weitere`].join("\n");
}

// The local notifications for the coming days (spec 4.5), at most two a day, both about
// everything open that is due up to the next school day, of every type (homework, exams,
// presentations, submissions, other entries); not sent if there is nothing:
// - The daily summary, 30 minutes after the last lesson, on a day without lessons at
//   `noLessonSummaryTime`.
// - The second reminder at `secondReminderTime`, every day including weekends, worded
//   differently. Dropped on a day whose summary comes later.
// The plan reflects the data at the time it is made, so it has to be made again on every change;
// a task checked off in the evening then no longer gets its second reminder.
export function planReminders({
  entries,
  lessons,
  periods,
  subjects,
  settings,
  now,
}: ReminderData): Reminder[] {
  if (!settings.notificationsEnabled) return [];

  const open = entries.filter((entry) => !entry.completed);
  const subjectOf = (entry: Entry) => subjects.find((subject) => subject.id === entry.subjectId);
  const today = toISODate(now);
  const reminders: Reminder[] = [];

  for (let offset = 0; offset < REMINDER_DAYS; offset++) {
    const day = addDays(today, offset);
    const schoolDay = nextSchoolDay(day, lessons);
    const dayName = schoolDay === addDays(day, 1) ? "morgen" : weekdayName(isoWeekday(schoolDay));
    const end = schoolEnd(isoWeekday(day), lessons, periods);
    const summaryDate = end
      ? at(day, end, AFTER_SCHOOL_MINUTES)
      : at(day, settings.noLessonSummaryTime);

    const dueUntilSchoolDay = open.filter((entry) => entry.date > day && entry.date <= schoolDay);
    if (dueUntilSchoolDay.length === 0) continue;
    const homework = dueUntilSchoolDay.filter((entry) => entry.type === "homework");
    const homeworkLines = homework.map((entry) => homeworkLine(entry, subjectOf(entry), schoolDay));
    const due: DueItem[] = dueUntilSchoolDay
      .filter((entry) => entry.type !== "homework")
      .map((entry) => ({ entry, subject: subjectOf(entry) }));
    // A tap opens the entry if the notification is about a single one
    const entryId = dueUntilSchoolDay.length === 1 ? dueUntilSchoolDay[0].id : null;
    const hasHomework = homework.length > 0;

    reminders.push({
      id: `summary-${day}`,
      date: summaryDate,
      title: summaryTitle(dayName, hasHomework, schoolDay, day),
      body: joinLines([...homeworkLines, ...due.map((item) => dueLine(item, day))]),
      entryId,
    });

    const secondDate = at(day, settings.secondReminderTime);
    if (secondDate > summaryDate) {
      reminders.push({
        id: `second-${day}`,
        date: secondDate,
        title: secondReminderTitle(dayName, hasHomework, schoolDay, day),
        body: joinLines([...homeworkLines, ...due.map((item) => dueLine(item, day, 1))]),
        entryId,
      });
    }
  }

  return reminders.filter((reminder) => reminder.date > now);
}
