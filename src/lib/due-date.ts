// The due date (Fälligkeit) the entry form suggests, from the timetable.
import type { EntryType, Lesson, Period } from "@/db/schema";
import { addDays } from "@/lib/dates";
import {
  type LessonOccurrence,
  type Now,
  subjectLessonOn,
  upcomingSubjectLessons,
} from "@/lib/schedule";

// "Fällig" of homework: at the next lesson of its subject, at the one after, or on a chosen date
export type DueChoice = "next" | "afterNext" | "custom";

// The fields of the entry form the due date follows from. A null subject is "Allgemein", a null
// period "Keine".
export type DueFields = {
  type: EntryType;
  subjectId: number | null;
  dueChoice: DueChoice;
  date: string;
  periodId: number | null;
  // Set once the user picks the value, so it is no longer suggested
  dateTouched: boolean;
  periodTouched: boolean;
};

export type Due = { date: string; periodId: number | null };

// The dates behind the "Fällig" choices of homework; null if the subject has no such lesson, so
// "next" falls back to tomorrow and "afterNext" is not offered.
export type DueChoiceDates = { next: string | null; afterNext: string | null };

// The lessons homework can be due at: the next two of its subject after `now`
function homeworkLessons(
  subjectId: number | null,
  lessons: Lesson[],
  periods: Period[],
  now: Now
): LessonOccurrence[] {
  return subjectId === null ? [] : upcomingSubjectLessons(subjectId, lessons, periods, 2, now);
}

export function dueChoiceDates(
  subjectId: number | null,
  lessons: Lesson[],
  periods: Period[],
  now: Now
): DueChoiceDates {
  const [next, afterNext] = homeworkLessons(subjectId, lessons, periods, now);
  return { next: next?.date ?? null, afterNext: afterNext?.date ?? null };
}

// The date and period that follow from the other fields:
// - Homework is due at the next lesson of its subject or the one after (the next one if there is
//   none after it), tomorrow if the subject has no lessons; a chosen date is kept.
// - Other entries are announced ahead, so until the date is touched it is the first lesson of the
//   subject from tomorrow on (tomorrow without lessons); until the period is touched it is the
//   subject's lesson on that date.
export function suggestDue(fields: DueFields, lessons: Lesson[], periods: Period[], now: Now): Due {
  const tomorrow = addDays(now.date, 1);
  const { subjectId } = fields;

  if (fields.type === "homework") {
    if (fields.dueChoice === "custom") return { date: fields.date, periodId: fields.periodId };
    const [first, second] = homeworkLessons(subjectId, lessons, periods, now);
    const pick = fields.dueChoice === "next" ? first : (second ?? first);
    return { date: pick?.date ?? tomorrow, periodId: pick?.period.id ?? null };
  }

  let date = fields.date;
  if (!fields.dateTouched) {
    const [first] =
      subjectId === null
        ? []
        : upcomingSubjectLessons(subjectId, lessons, periods, 1, { date: tomorrow, minutes: 0 });
    date = first?.date ?? tomorrow;
  }
  let periodId = fields.periodId;
  if (!fields.periodTouched) {
    const lesson =
      subjectId === null ? undefined : subjectLessonOn(subjectId, date, lessons, periods);
    periodId = lesson?.period.id ?? null;
  }
  return { date, periodId };
}
