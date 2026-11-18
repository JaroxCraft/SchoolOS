import type { Entry, Lesson, Period, Settings, Subject } from "@/db/schema";
import { t } from "@/i18n";
import { addDays, dateAt, isoWeekday, minutesOf, toISODate } from "@/lib/dates";
import { findById } from "@/lib/find";
import {
  type DueItem,
  dueLine,
  homeworkLine,
  secondReminderTitle,
  summaryTitle,
} from "@/lib/reminder-texts";
import { nextSchoolDay, schoolEnd } from "@/lib/schedule";

// Days planned ahead. iOS keeps at most 64 pending notifications per app and a day has at most
// two; the plan is renewed whenever the data changes or a new day begins in the open app.
const REMINDER_DAYS = 21;
export const AFTER_SCHOOL_MINUTES = 30;
// The rest is counted as "and 2 more"
const MAX_LINES_PER_NOTIFICATION = 4;

export type Reminder = {
  id: string;
  date: Date;
  title: string;
  body: string;
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

function joinLines(lines: string[]): string {
  if (lines.length <= MAX_LINES_PER_NOTIFICATION) return lines.join("\n");
  const shown = lines.slice(0, MAX_LINES_PER_NOTIFICATION - 1);
  return [...shown, t.notifications.reminders.more(lines.length - shown.length)].join("\n");
}

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
  const subjectOf = (entry: Entry) => findById(subjects, entry.subjectId);
  const today = toISODate(now);
  const reminders: Reminder[] = [];

  for (let offset = 0; offset < REMINDER_DAYS; offset++) {
    const day = addDays(today, offset);
    const schoolDay = nextSchoolDay(day, lessons);
    const end = schoolEnd(isoWeekday(day), lessons, periods);
    const summaryDate =
      end !== null
        ? dateAt(day, end + AFTER_SCHOOL_MINUTES)
        : dateAt(day, minutesOf(settings.noLessonSummaryTime));

    const dueUntilSchoolDay = open.filter((entry) => entry.date > day && entry.date <= schoolDay);
    if (dueUntilSchoolDay.length === 0) continue;
    const homework = dueUntilSchoolDay.filter((entry) => entry.type === "homework");
    const homeworkLines = homework.map((entry) => homeworkLine(entry, subjectOf(entry), schoolDay));
    const due: DueItem[] = dueUntilSchoolDay
      .filter((entry) => entry.type !== "homework")
      .map((entry) => ({ entry, subject: subjectOf(entry) }));
    const entryId = dueUntilSchoolDay.length === 1 ? dueUntilSchoolDay[0].id : null;
    const hasHomework = homework.length > 0;

    reminders.push({
      id: `summary-${day}`,
      date: summaryDate,
      title: summaryTitle(hasHomework, schoolDay, day),
      body: joinLines([...homeworkLines, ...due.map((item) => dueLine(item, day))]),
      entryId,
    });

    const secondDate = dateAt(day, minutesOf(settings.secondReminderTime));
    if (secondDate > summaryDate) {
      reminders.push({
        id: `second-${day}`,
        date: secondDate,
        title: secondReminderTitle(hasHomework, schoolDay, day),
        body: joinLines([...homeworkLines, ...due.map((item) => dueLine(item, day, 1))]),
        entryId,
      });
    }
  }

  return reminders.filter((reminder) => reminder.date > now);
}
