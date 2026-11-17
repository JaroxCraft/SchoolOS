import type { Entry, Lesson, Period, Settings, Subject } from "@/db/schema";
import { addDays, formatDate, isoWeekday, parseISODate, toISODate, weekdayName } from "@/lib/dates";
import { ENTRY_TYPE_INFO, isCheckable } from "@/lib/entry-types";

// Days planned ahead. iOS keeps at most 64 pending notifications per app and a day has at most
// two; the plan is renewed whenever the data changes or a new day begins in the open app.
export const REMINDER_DAYS = 21;
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

function at(date: string, time: string): Date {
  const [hours, minutes] = time.split(":").map(Number);
  const result = parseISODate(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

// "Prüfung Mathematik: Vokabeltest", "Deutsch: Aufsatz", with the date when it is not `due`
function entryLine(entry: Entry, subjects: Subject[], due: string | null): string {
  const subject = subjects.find((candidate) => candidate.id === entry.subjectId);
  const info = ENTRY_TYPE_INFO[entry.type];
  const label = [info.gradable ? info.label : null, subject?.name].filter(Boolean).join(" ");
  const line = label ? `${label}: ${entry.title}` : entry.title;
  return entry.date === due ? line : `${line} (${formatDate(entry.date)})`;
}

function joinLines(lines: string[]): string {
  if (lines.length <= MAX_LINES) return lines.join("\n");
  const shown = lines.slice(0, MAX_LINES - 1);
  return [...shown, `und ${lines.length - shown.length} weitere`].join("\n");
}

// The local notifications for the coming days, at most two a day:
// - The summary when the last lesson of the day ends, on a day without lessons at
//   `noLessonSummaryTime`: everything due up to the next school day (homework and submissions
//   not yet done, exams, presentations, other entries) and the exams, presentations and
//   submissions whose study start is today.
// - The second reminder at `secondReminderTime` on the evening before a school day, if it comes
//   after the summary: the homework and submissions for that day that are still open. Over a
//   weekend only on Sunday, the summaries of Friday and Saturday already list them.
// The plan reflects the data at the time it is made, so it has to be made again on every change;
// a task checked off later in the evening then no longer gets its second reminder.
export function planReminders({
  entries,
  lessons,
  periods,
  subjects,
  settings,
  now,
}: ReminderData): Reminder[] {
  if (!settings.notificationsEnabled) return [];

  const open = entries.filter((entry) => !(isCheckable(entry.type) && entry.completed));
  const today = toISODate(now);
  const reminders: Reminder[] = [];

  for (let offset = 0; offset < REMINDER_DAYS; offset++) {
    const day = addDays(today, offset);
    const schoolDay = nextSchoolDay(day, lessons);
    const tomorrow = addDays(day, 1);
    const dayName = schoolDay === tomorrow ? "morgen" : weekdayName(isoWeekday(schoolDay));
    const summaryTime =
      schoolEnd(isoWeekday(day), lessons, periods) ?? settings.noLessonSummaryTime;

    const due = open.filter((entry) => entry.date > day && entry.date <= schoolDay);
    const studyStarts = open.filter((entry) => entry.studyStart === day && entry.date > day);
    const mentioned = [...due, ...studyStarts];
    if (mentioned.length > 0) {
      reminders.push({
        id: `summary-${day}`,
        date: at(day, summaryTime),
        title: due.length > 0 ? `Für ${dayName}` : "Lernbeginn",
        body: joinLines([
          ...due.map((entry) => entryLine(entry, subjects, schoolDay)),
          ...studyStarts.map((entry) => `Ab heute lernen für ${entryLine(entry, subjects, null)}`),
        ]),
        // A tap opens the entry if the notification is about a single one
        entryId: mentioned.length === 1 ? mentioned[0].id : null,
      });
    }

    const tasks = due.filter((entry) => isCheckable(entry.type));
    if (tasks.length > 0 && schoolDay === tomorrow && settings.secondReminderTime > summaryTime) {
      reminders.push({
        id: `second-${day}`,
        date: at(day, settings.secondReminderTime),
        title: "Noch offen für morgen",
        body: joinLines(tasks.map((entry) => entryLine(entry, subjects, schoolDay))),
        entryId: tasks.length === 1 ? tasks[0].id : null,
      });
    }
  }

  return reminders.filter((reminder) => reminder.date > now);
}
