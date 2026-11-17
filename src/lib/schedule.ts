// The school week: the time rules of the period grid (Lektionenraster) and the timetable
// (Stundenplan). Periods must be sorted by start time (as returned by usePeriods); times are
// compared as minutes since midnight.
import type { Lesson, LessonDraft, Period } from "@/db/schema";
import { addDays, isoWeekday, minutesOf, SCHOOL_WEEKDAYS, type Weekday } from "@/lib/dates";

export type Now = { date: string; minutes: number };

export type LessonOccurrence = {
  date: string;
  lesson: Lesson;
  period: Period;
};

export type LessonBlock = {
  key: string;
  lesson: Lesson;
  period: Period;
  start: number;
  end: number;
  firstNumber: number;
  lastNumber: number;
};

export type SchoolDay = { weekday: Weekday; date: string };

export type LessonState = "past" | "current" | "upcoming";

export function periodNumber(periods: Period[], periodId: number): number {
  return periods.findIndex((period) => period.id === periodId) + 1;
}

export function periodLabel(number: number): string {
  return `${number}. Lektion`;
}

export function periodRange(period: Period): string {
  return `${period.startTime}–${period.endTime}`;
}

// The lesson in a slot of the timetable (saved or being edited); each slot holds at most one.
export function lessonAt<T extends LessonDraft>(
  lessons: T[],
  weekday: Weekday,
  periodId: number
): T | undefined {
  return lessons.find((lesson) => lesson.weekday === weekday && lesson.periodId === periodId);
}

export function lessonState(
  date: string,
  span: { start: number; end: number },
  now: Now
): LessonState {
  if (date !== now.date) return "upcoming";
  if (now.minutes >= span.end) return "past";
  return now.minutes >= span.start ? "current" : "upcoming";
}

const spanOf = (period: Period) => ({
  start: minutesOf(period.startTime),
  end: minutesOf(period.endTime),
});

export function lessonBlocks(
  lessons: Lesson[],
  periods: Period[],
  weekday: Weekday
): LessonBlock[] {
  const blocks: LessonBlock[] = [];
  periods.forEach((period, index) => {
    const lesson = lessonAt(lessons, weekday, period.id);
    if (!lesson) return;
    const previous = blocks.at(-1);
    if (
      previous &&
      previous.lastNumber === index &&
      previous.lesson.subjectId === lesson.subjectId &&
      previous.lesson.room === lesson.room
    ) {
      previous.end = minutesOf(period.endTime);
      previous.lastNumber = index + 1;
      return;
    }
    blocks.push({
      key: `${weekday}-${period.id}`,
      lesson,
      period,
      ...spanOf(period),
      firstNumber: index + 1,
      lastNumber: index + 1,
    });
  });
  return blocks;
}

export function visiblePeriods(lessons: Lesson[], periods: Period[]): Period[] {
  const isUsed = (period: Period) => lessons.some((lesson) => lesson.periodId === period.id);
  const first = periods.findIndex(isUsed);
  if (first === -1) return [];
  const last = periods.findLastIndex(isUsed);
  return periods.slice(first, last + 1);
}

export function shownWeekday(date: string): Weekday {
  const weekday = isoWeekday(date);
  return weekday <= 5 ? weekday : 1;
}

export function schoolWeek(date: string): SchoolDay[] {
  const weekday = isoWeekday(date);
  const monday = addDays(date, weekday <= 5 ? 1 - weekday : 8 - weekday);
  return SCHOOL_WEEKDAYS.map((day) => ({ weekday: day, date: addDays(monday, day - 1) }));
}

export function nextSchoolDay(date: string, lessons: Lesson[]): string {
  for (let offset = 1; offset <= 7; offset++) {
    const day = addDays(date, offset);
    if (lessons.some((lesson) => lesson.weekday === isoWeekday(day))) return day;
  }
  return addDays(date, 1);
}

export function schoolEnd(weekday: Weekday, lessons: Lesson[], periods: Period[]): number | null {
  const ends = lessons
    .filter((lesson) => lesson.weekday === weekday)
    .flatMap((lesson) => periods.filter((period) => period.id === lesson.periodId))
    .map((period) => minutesOf(period.endTime));
  return ends.length > 0 ? Math.max(...ends) : null;
}

function lessonsOn(date: string, lessons: Lesson[], periods: Period[]): LessonOccurrence[] {
  const weekday = isoWeekday(date);
  return periods.flatMap((period) => {
    const lesson = lessonAt(lessons, weekday, period.id);
    return lesson ? [{ date, lesson, period }] : [];
  });
}

function subjectBlocksOn(
  subjectId: number,
  date: string,
  lessons: Lesson[],
  periods: Period[]
): LessonBlock[] {
  return lessonBlocks(lessons, periods, isoWeekday(date)).filter(
    (block) => block.lesson.subjectId === subjectId
  );
}

export function upcomingSubjectLessons(
  subjectId: number,
  lessons: Lesson[],
  periods: Period[],
  count: number,
  now: Now
): LessonOccurrence[] {
  if (!lessons.some((lesson) => lesson.subjectId === subjectId)) return [];

  const result: LessonOccurrence[] = [];
  for (let offset = 0; result.length < count && offset <= 7 * count; offset++) {
    const date = addDays(now.date, offset);
    for (const block of subjectBlocksOn(subjectId, date, lessons, periods)) {
      if (lessonState(date, block, now) !== "upcoming") continue;
      result.push({ date, lesson: block.lesson, period: block.period });
    }
  }
  return result.slice(0, count);
}

export function subjectLessonOn(
  subjectId: number,
  date: string,
  lessons: Lesson[],
  periods: Period[]
): LessonOccurrence | undefined {
  const block = subjectBlocksOn(subjectId, date, lessons, periods)[0];
  return block && { date, lesson: block.lesson, period: block.period };
}

export function nextLessons(lessons: Lesson[], periods: Period[], now: Now): LessonOccurrence[] {
  const remaining = lessonsOn(now.date, lessons, periods).filter(
    ({ date, period }) => lessonState(date, spanOf(period), now) !== "past"
  );
  if (remaining.length > 0) return remaining;
  return lessonsOn(nextSchoolDay(now.date, lessons), lessons, periods);
}
