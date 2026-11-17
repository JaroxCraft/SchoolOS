import type { Lesson, Period } from "@/db/schema";
import { addDays } from "@/lib/dates";
import {
  type LessonOccurrence,
  type Now,
  subjectLessonOn,
  upcomingSubjectLessons,
} from "@/lib/schedule";

export type DueChoice = "next" | "afterNext" | "custom";

export type DueFields = {
  subjectId: number | null;
  dueChoice: DueChoice;
  date: string;
  periodId: number | null;
  periodPickedByUser: boolean;
};

export type Due = { date: string; periodId: number | null };

export type DueChoiceDates = { next: string | null; afterNext: string | null };

function nextTwoSubjectLessons(
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
  const [next, afterNext] = nextTwoSubjectLessons(subjectId, lessons, periods, now);
  return { next: next?.date ?? null, afterNext: afterNext?.date ?? null };
}

export function suggestDue(fields: DueFields, lessons: Lesson[], periods: Period[], now: Now): Due {
  const { subjectId, date } = fields;

  if (fields.dueChoice !== "custom") {
    const [first, second] = nextTwoSubjectLessons(subjectId, lessons, periods, now);
    const pick = fields.dueChoice === "next" ? first : (second ?? first);
    return { date: pick?.date ?? addDays(now.date, 1), periodId: pick?.period.id ?? null };
  }

  if (fields.periodPickedByUser) return { date, periodId: fields.periodId };
  const lesson =
    subjectId === null ? undefined : subjectLessonOn(subjectId, date, lessons, periods);
  return { date, periodId: lesson?.period.id ?? null };
}
