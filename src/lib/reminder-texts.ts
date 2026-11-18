import type { Entry, Subject } from "@/db/schema";
import { t } from "@/i18n";
import { daysBetween, formatDate, isoWeekday, weekdayName } from "@/lib/dates";
import { ENTRY_TYPE_INFO } from "@/lib/entry-types";

export type DueItem = { entry: Entry; subject: Subject | undefined };

const texts = t.notifications.reminders;

type DueLineVariant = (params: { when: string; When: string; what: string }) => string;
// Homework has no due lines; it is listed with homeworkLine
const DUE_LINES: Partial<Record<Entry["type"], DueLineVariant[]>> = texts.dueLines;

function pick<T>(variants: T[], day: string, shift = 0): T {
  return variants[(daysBetween("2000-01-01", day) + shift) % variants.length];
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

// The school day `date` as seen on `day`: its name ("tomorrow", "Monday") and when it is
// ("tomorrow", "on Monday"), also capitalized for the start of a sentence
function schoolDayWords(date: string, day: string) {
  const tomorrow = daysBetween(day, date) === 1;
  const weekday = weekdayName(isoWeekday(date));
  const when = tomorrow ? texts.tomorrow : texts.onWeekday(weekday);
  return { dayName: tomorrow ? texts.tomorrow : weekday, when, When: capitalize(when) };
}

function dueWhat({ entry, subject }: DueItem): string {
  return texts.dueWhat({
    type: entry.type === "other" ? undefined : ENTRY_TYPE_INFO[entry.type].label,
    subject: subject?.name,
    title: entry.title,
  });
}

export function dueLine(item: DueItem, day: string, shift = 0): string {
  const { when, When } = schoolDayWords(item.entry.date, day);
  const variants = DUE_LINES[item.entry.type] ?? texts.dueLines.other;
  return pick(variants, day, shift)({ when, When, what: dueWhat(item) });
}

export function homeworkLine(entry: Entry, subject: Subject | undefined, schoolDay: string) {
  return texts.homework({
    subject: subject?.name,
    title: entry.title,
    date: entry.date === schoolDay ? undefined : formatDate(entry.date),
  });
}

export function summaryTitle(hasHomework: boolean, schoolDay: string, day: string): string {
  const variants = texts.summaryTitles[hasHomework ? "homework" : "noHomework"];
  return pick(variants, day)(schoolDayWords(schoolDay, day));
}

export function secondReminderTitle(hasHomework: boolean, schoolDay: string, day: string): string {
  const variants = texts.secondTitles[hasHomework ? "homework" : "noHomework"];
  return pick(variants, day)(schoolDayWords(schoolDay, day));
}
