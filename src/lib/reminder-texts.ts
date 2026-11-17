import type { Entry, EntryType, Subject } from "@/db/schema";
import { daysBetween, formatDate } from "@/lib/dates";
import { ENTRY_TYPE_INFO } from "@/lib/entry-types";

// The wording of the reminders (spec 4.5): several variants per text, so the same notification
// never reads the same on two days in a row, and more urgent the closer the date. Motivating,
// without pressure.

// An exam, presentation or submission whose study period runs on the day of the notification
export type StudyItem = { entry: Entry; subject: Subject | undefined; daysLeft: number };

// Variants change from one day to the next: consecutive days get consecutive variants
function pick(variants: string[], day: string): string {
  return variants[daysBetween("2000-01-01", day) % variants.length];
}

// «Prüfung Französisch «Voci»», «Abgabe «Laborbericht»» for an entry without subject
function studyWhat({ entry, subject }: StudyItem): string {
  return `${[ENTRY_TYPE_INFO[entry.type].label, subject?.name].filter(Boolean).join(" ")} «${entry.title}»`;
}

const LAST_DAY: Partial<Record<EntryType, string[]>> = {
  exam: [
    "Morgen: {what} – letzte Wiederholung?",
    "{what} ist morgen – nochmals alles durchgehen?",
    "Morgen ist es so weit: {what}. Du schaffst das!",
  ],
  presentation: [
    "Morgen: {what} – ein letzter Durchgang?",
    "{what} ist morgen – nochmals laut üben?",
    "Morgen ist es so weit: {what}. Du schaffst das!",
  ],
  submission: [
    "Morgen: {what} – alles bereit?",
    "{what} ist morgen fällig – fehlt noch etwas?",
    "Morgen ist es so weit: {what}. Fast geschafft!",
  ],
};

const FIRST_DAY = [
  "{what} in {n} Tagen – guter Moment zum Starten",
  "{what} in {n} Tagen – heute ist Lernbeginn",
  "Ab heute lernen: {what} in {n} Tagen",
];

const MIDDLE = [
  "{what} in {n} Tagen – dranbleiben!",
  "{what} in {n} Tagen – heute ein Stück weiter?",
  "Noch {n} Tage: {what}",
];

// One line of a study item: relaxed at the study start, urgent the day before
export function studyLine(item: StudyItem, day: string): string {
  const variants =
    item.daysLeft === 1
      ? (LAST_DAY[item.entry.type] ?? LAST_DAY.exam!)
      : item.entry.studyStart === day
        ? FIRST_DAY
        : MIDDLE;
  return pick(variants, day)
    .replace("{what}", studyWhat(item))
    .replace("{n}", String(item.daysLeft));
}

// "Mathematik: S. 42", with the date when the homework is not due on the school day itself
export function homeworkLine(entry: Entry, subject: Subject | undefined, schoolDay: string) {
  const line = subject ? `${subject.name}: ${entry.title}` : entry.title;
  return entry.date === schoolDay ? line : `${line} (${formatDate(entry.date)})`;
}

export function summaryTitle(
  // "morgen", or the weekday of a later school day ("Montag")
  dayName: string,
  hasHomework: boolean,
  study: StudyItem[],
  day: string
): string {
  if (hasHomework) {
    return pick(
      [`Für ${dayName}`, `Hausaufgaben für ${dayName}`, `Das ist bis ${dayName} zu tun`],
      day
    );
  }
  if (study.some((item) => item.daysLeft === 1)) {
    return pick(["Morgen ist es so weit", "Endspurt", "Letzte Vorbereitung"], day);
  }
  if (study.some((item) => item.entry.studyStart === day)) {
    return pick(["Lernbeginn", "Zeit zum Starten", "Guter Moment zum Lernen"], day);
  }
  return pick(["Dranbleiben", "Lernzeit", "Heute ein Stück weiter"], day);
}

export function secondReminderTitle(dayName: string, day: string): string {
  return pick(
    [
      `Noch offen für ${dayName}`,
      `Schon alles erledigt für ${dayName}?`,
      `Bis ${dayName} zu erledigen`,
    ],
    day
  );
}
