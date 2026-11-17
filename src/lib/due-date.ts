// When an entry is due (Fälligkeit), suggested by the entry form from the timetable. The same for
// every type: at the next lesson of its subject, at the one after, or on a chosen date.
import type { Lesson, Period } from "@/db/schema";
import { addDays } from "@/lib/dates";
import {
  type LessonOccurrence,
  type Now,
  subjectLessonOn,
  upcomingSubjectLessons,
} from "@/lib/schedule";

export type DueChoice = "next" | "afterNext" | "custom";

// The fields of the entry form the due date follows from. A null subject is "Allgemein", a null
// period "Keine".
export type DueFields = {
  subjectId: number | null;
  dueChoice: DueChoice;
  date: string;
  periodId: number | null;
  // Set once the user picks the Lektion of a chosen date, so it is no longer suggested
  periodTouched: boolean;
};

export type Due = { date: string; periodId: number | null };

// The dates behind the choices; null if the subject has no such lesson, so "next" falls back to
// tomorrow and "afterNext" is not offered.
export type DueChoiceDates = { next: string | null; afterNext: string | null };

// The next two lessons of the subject after `now`: the lesson in progress does not count (what is
// given in it is due at the following one), a later one today does
function nextLessons(
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
  const [next, afterNext] = nextLessons(subjectId, lessons, periods, now);
  return { next: next?.date ?? null, afterNext: afterNext?.date ?? null };
}

// The date and Lektion that follow from the other fields:
// - "next" and "afterNext" take the date and Lektion of that lesson of the subject ("afterNext"
//   the next one if there is none after it), tomorrow without a Lektion if it has no lessons.
// - A chosen date is kept; its Lektion is the subject's lesson on that date until the user picks
//   one.
export function suggestDue(fields: DueFields, lessons: Lesson[], periods: Period[], now: Now): Due {
  const { subjectId, date } = fields;

  if (fields.dueChoice !== "custom") {
    const [first, second] = nextLessons(subjectId, lessons, periods, now);
    const pick = fields.dueChoice === "next" ? first : (second ?? first);
    return { date: pick?.date ?? addDays(now.date, 1), periodId: pick?.period.id ?? null };
  }

  if (fields.periodTouched) return { date, periodId: fields.periodId };
  const lesson =
    subjectId === null ? undefined : subjectLessonOn(subjectId, date, lessons, periods);
  return { date, periodId: lesson?.period.id ?? null };
}
