import type { Lesson, LessonSlot, Period } from "@/db/schema";
import type { Now } from "@/hooks/use-now";
import { addDays, isoWeekday, minutesToTime } from "@/lib/dates";

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

// The lessons of a subject on a date. A double lesson (consecutive periods in the same room, one
// card in the timetable) counts once, at its first period.
function subjectLessonsOn(
  subjectId: number,
  date: string,
  lessons: Lesson[],
  periods: Period[]
): LessonOccurrence[] {
  const occurrences = lessonsOn(
    date,
    lessons.filter((lesson) => lesson.subjectId === subjectId),
    periods
  );
  return occurrences.filter((occurrence, index) => {
    const previous = occurrences[index - 1];
    return !(
      previous &&
      periods.indexOf(previous.period) + 1 === periods.indexOf(occurrence.period) &&
      previous.lesson.room === occurrence.lesson.room
    );
  });
}

// The next `count` lessons of a subject after `now`. A lesson later today counts, the one in
// progress does not, so homework given in it is due at the following lesson. Two lessons on the
// same day are two lessons.
export function upcomingSubjectLessons(
  subjectId: number,
  lessons: Lesson[],
  periods: Period[],
  count: number,
  now: Now
): LessonOccurrence[] {
  if (!lessons.some((lesson) => lesson.subjectId === subjectId)) return [];

  const time = minutesToTime(now.minutes);
  const result: LessonOccurrence[] = [];
  for (let offset = 0; result.length < count && offset <= 7 * count; offset++) {
    const day = subjectLessonsOn(subjectId, addDays(now.date, offset), lessons, periods);
    result.push(...(offset === 0 ? day.filter(({ period }) => period.startTime > time) : day));
  }
  return result.slice(0, count);
}

// The lesson of a subject on a given date, used to suggest the period of an exam.
export function subjectLessonOn(
  subjectId: number,
  date: string,
  lessons: Lesson[],
  periods: Period[]
): LessonOccurrence | undefined {
  return subjectLessonsOn(subjectId, date, lessons, periods)[0];
}

// The remaining lessons of today, or all lessons of the next school day after school. Takes the
// time from useNow, so the screen shows the next lessons again as the day goes on.
export function nextLessons(lessons: Lesson[], periods: Period[], now: Now): LessonOccurrence[] {
  const time = minutesToTime(now.minutes);
  const remaining = lessonsOn(now.date, lessons, periods).filter(
    ({ period }) => period.endTime > time
  );
  if (remaining.length > 0) return remaining;

  for (let offset = 1; offset <= 7; offset++) {
    const upcoming = lessonsOn(addDays(now.date, offset), lessons, periods);
    if (upcoming.length > 0) return upcoming;
  }
  return [];
}
