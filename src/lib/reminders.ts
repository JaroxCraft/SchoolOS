import type { Entry, Lesson, Period, Settings, Subject } from "@/db/schema";
import { t } from "@/i18n";
import {
  addDays,
  dateAt,
  formatDate,
  type IsoDate,
  isoWeekday,
  minutesOf,
  toISODate,
} from "@/lib/dates";
import { ENTRY_TYPE_INFO } from "@/lib/entry-types";
import { findById } from "@/lib/find";
import { nextSchoolDay, schoolEnd } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";

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

// "Prüfung · Mathematik · Bruchrechnen", with the date if the entry is due before the school day
function entryLine(entry: Entry, subject: Subject | undefined, schoolDay: IsoDate): string {
  const date = entry.date === schoolDay ? undefined : formatDate(entry.date);
  return joinDetails(ENTRY_TYPE_INFO[entry.type].label, subject?.name, entry.title, date)!;
}

function joinLines(lines: string[]): string {
  if (lines.length <= MAX_LINES_PER_NOTIFICATION) return lines.join("\n");
  const shown = lines.slice(0, MAX_LINES_PER_NOTIFICATION - 1);
  return [...shown, t.notifications.more(lines.length - shown.length)].join("\n");
}

// Every day with something open that is due by the next school day gets a summary after school
// (or at a fixed time on days without lessons) and the same notification again in the evening.
// The title is the school day, the body lists the entries.
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
  const today = toISODate(now);
  const reminders: Reminder[] = [];

  for (let offset = 0; offset < REMINDER_DAYS; offset++) {
    const day = addDays(today, offset);
    const schoolDay = nextSchoolDay(day, lessons);
    const due = open.filter((entry) => entry.date > day && entry.date <= schoolDay);
    if (due.length === 0) continue;

    const content = {
      title: formatDate(schoolDay),
      body: joinLines(
        due.map((entry) => entryLine(entry, findById(subjects, entry.subjectId), schoolDay))
      ),
      // A tap opens the entry if there is only one, else the Agenda
      entryId: due.length === 1 ? due[0].id : null,
    };

    const end = schoolEnd(isoWeekday(day), lessons, periods);
    const summaryDate =
      end !== null
        ? dateAt(day, end + AFTER_SCHOOL_MINUTES)
        : dateAt(day, minutesOf(settings.noLessonSummaryTime));
    reminders.push({ id: `summary-${day}`, date: summaryDate, ...content });

    // Dropped when the summary comes later the same day
    const secondDate = dateAt(day, minutesOf(settings.secondReminderTime));
    if (secondDate > summaryDate) {
      reminders.push({ id: `second-${day}`, date: secondDate, ...content });
    }
  }

  return reminders.filter((reminder) => reminder.date > now);
}
