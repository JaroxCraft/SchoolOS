import type { Lesson, LessonSlot, Period } from "@/db/schema";
import { addDays, currentTime, isoWeekday, today } from "@/lib/dates";

export type LessonOccurrence = {
  date: string;
  lesson: Lesson;
  period: Period;
};

// Periods must be sorted by start time (as returned by usePeriods).
export function periodNumber(periods: Period[], periodId: number): number {
  return periods.findIndex((period) => period.id === periodId) + 1;
}

// "07:30–08:15"
export function periodRange(period: Period): string {
  return `${period.startTime}–${period.endTime}`;
}

// The lesson in a slot of the timetable (saved or being edited); each slot holds at most one.
export function lessonAt<T extends LessonSlot>(
  lessons: T[],
  weekday: number,
  periodId: number
): T | undefined {
  return lessons.find((lesson) => lesson.weekday === weekday && lesson.periodId === periodId);
}

function lessonsOn(date: string, lessons: Lesson[], periods: Period[]): LessonOccurrence[] {
  const weekday = isoWeekday(date);
  return periods.flatMap((period) => {
    const lesson = lessonAt(lessons, weekday, period.id);
    return lesson ? [{ date, lesson, period }] : [];
  });
}

// The first lesson of a subject on each of the next days after `from`, at most `count` days.
export function upcomingSubjectLessons(
  subjectId: number,
  lessons: Lesson[],
  periods: Period[],
  count: number,
  from = today()
): LessonOccurrence[] {
  const subjectLessons = lessons.filter((lesson) => lesson.subjectId === subjectId);
  if (subjectLessons.length === 0) return [];

  const result: LessonOccurrence[] = [];
  for (let offset = 1; result.length < count && offset <= 7 * count; offset++) {
    const [first] = lessonsOn(addDays(from, offset), subjectLessons, periods);
    if (first) result.push(first);
  }
  return result;
}

// The lesson of a subject on a given date, used to suggest the period of an exam.
export function subjectLessonOn(
  subjectId: number,
  date: string,
  lessons: Lesson[],
  periods: Period[]
): LessonOccurrence | undefined {
  return lessonsOn(
    date,
    lessons.filter((lesson) => lesson.subjectId === subjectId),
    periods
  )[0];
}

// The remaining lessons of today, or all lessons of the next school day after school.
export function nextLessons(lessons: Lesson[], periods: Period[]): LessonOccurrence[] {
  const now = currentTime();
  const remaining = lessonsOn(today(), lessons, periods).filter(
    ({ period }) => period.endTime > now
  );
  if (remaining.length > 0) return remaining;

  for (let offset = 1; offset <= 7; offset++) {
    const upcoming = lessonsOn(addDays(today(), offset), lessons, periods);
    if (upcoming.length > 0) return upcoming;
  }
  return [];
}
