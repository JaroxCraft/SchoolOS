import type { Entry, Subject } from "@/db/schema";
import { daysBetween, formatDate, isoWeekday, weekdayName } from "@/lib/dates";
import { ENTRY_TYPE_INFO } from "@/lib/entry-types";

// The wording of the reminders (spec 4.5): several variants per text, so the same notification
// never reads the same on two days in a row, worded per type. Motivating, without pressure.

// An exam, presentation, submission or other entry due up to the next school day
export type DueItem = { entry: Entry; subject: Subject | undefined };

// Variants change from one day to the next: consecutive days get consecutive variants. `shift`
// gives the second reminder of a day other variants than its summary.
function pick(variants: string[], day: string, shift = 0): string {
  return variants[(daysBetween("2000-01-01", day) + shift) % variants.length];
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

// "morgen" for the day after `day`, else "am Montag"
export function whenText(date: string, day: string): string {
  return daysBetween(day, date) === 1 ? "morgen" : `am ${weekdayName(isoWeekday(date))}`;
}

// «Prüfung Französisch «Voci»», «Abgabe «Laborbericht»» without subject, «Deutsch «Exkursion»» for
// an other entry, whose type label ("Sonstiges") says nothing
function dueWhat({ entry, subject }: DueItem): string {
  const label = entry.type === "other" ? null : ENTRY_TYPE_INFO[entry.type].label;
  const prefix = [label, subject?.name].filter(Boolean).join(" ");
  return prefix ? `${prefix} «${entry.title}»` : `«${entry.title}»`;
}

const DUE_LINES: Record<string, string[]> = {
  exam: [
    "{When}: {what} – letzte Wiederholung?",
    "{what} ist {when} – nochmals alles durchgehen?",
    "{When} ist es so weit: {what}. Du schaffst das!",
  ],
  presentation: [
    "{When}: {what} – ein letzter Durchgang?",
    "{what} ist {when} – nochmals laut üben?",
    "{When} ist es so weit: {what}. Du schaffst das!",
  ],
  submission: [
    "{When}: {what} – alles bereit?",
    "{what} ist {when} fällig – fehlt noch etwas?",
    "{When} ist es so weit: {what}. Fast geschafft!",
  ],
  other: ["{When}: {what}", "Nicht vergessen: {what} ist {when}", "{what} ist {when}"],
};

// One line of an exam, presentation, submission or other entry, e.g. "Morgen: Prüfung
// Französisch «Voci» – letzte Wiederholung?"
export function dueLine(item: DueItem, day: string, shift = 0): string {
  const when = whenText(item.entry.date, day);
  return pick(DUE_LINES[item.entry.type] ?? DUE_LINES.other, day, shift)
    .replace("{When}", capitalize(when))
    .replace("{when}", when)
    .replace("{what}", dueWhat(item));
}

// "Mathematik: S. 42", with the date when the homework is not due on the school day itself
export function homeworkLine(entry: Entry, subject: Subject | undefined, schoolDay: string) {
  const line = subject ? `${subject.name}: ${entry.title}` : entry.title;
  return entry.date === schoolDay ? line : `${line} (${formatDate(entry.date)})`;
}

// `dayName`: "morgen", or the weekday of a later school day ("Montag")
export function summaryTitle(
  dayName: string,
  hasHomework: boolean,
  schoolDay: string,
  day: string
): string {
  const when = whenText(schoolDay, day);
  if (hasHomework) {
    return pick([`Für ${dayName}`, `Das steht ${when} an`, `Bis ${dayName} zu erledigen`], day);
  }
  return pick([`${capitalize(when)} ist es so weit`, "Endspurt", "Letzte Vorbereitung"], day);
}

export function secondReminderTitle(
  dayName: string,
  hasHomework: boolean,
  schoolDay: string,
  day: string
): string {
  const when = whenText(schoolDay, day);
  if (hasHomework) {
    return pick(
      [
        `Noch offen für ${dayName}`,
        `Schon alles bereit für ${dayName}?`,
        `Zur Erinnerung: ${when}`,
      ],
      day
    );
  }
  return pick(
    [`Bereit für ${dayName}?`, "Noch einmal zur Erinnerung", `${capitalize(when)} gilt es`],
    day
  );
}
