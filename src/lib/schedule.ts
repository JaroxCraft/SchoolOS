// The school week: the time rules of the period grid (Lektionenraster) and the timetable
// (Stundenplan). Periods must be sorted by start time (as returned by usePeriods); times are
// compared as minutes since midnight.
import type { Lesson, LessonSlot, Period } from "@/db/schema";
import { addDays, isoWeekday, minutesOf, SCHOOL_WEEKDAYS } from "@/lib/dates";

// Today's date and the minutes since midnight (see useNow)
export type Now = { date: string; minutes: number };

export type LessonOccurrence = {
  date: string;
  lesson: Lesson;
  period: Period;
};

// One card of the timetable: a lesson, or consecutive lessons of the same subject in the same room
// (a double lesson), which span the break between them like one event in Calendar and count as
// one lesson everywhere.
export type LessonBlock = {
  key: string;
  // The lesson and period it starts with; subject and room are those of every lesson in it
  lesson: Lesson;
  period: Period;
  // Minutes since midnight
  start: number;
  end: number;
  // Numbers of the first and last period (1-based)
  firstNumber: number;
  lastNumber: number;
};

// A school day of the shown week
export type SchoolDay = { weekday: number; date: string };

export type LessonState = "past" | "current" | "upcoming";

export function periodNumber(periods: Period[], periodId: number): number {
  return periods.findIndex((period) => period.id === periodId) + 1;
}

// "3. Lektion"
export function periodLabel(number: number): string {
  return `${number}. Lektion`;
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

// Where a lesson of `date` stands at `now`: on other days it is upcoming, on today it is current
// from its start until its end.
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

export function lessonBlocks(lessons: Lesson[], periods: Period[], weekday: number): LessonBlock[] {
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

// The periods the timetable shows: from the first to the last period with a lesson on any day,
// so neither view ends in a long empty stretch.
export function visiblePeriods(lessons: Lesson[], periods: Period[]): Period[] {
  const used = periods
    .map((period, index) => (lessons.some((lesson) => lesson.periodId === period.id) ? index : -1))
    .filter((index) => index >= 0);
  if (used.length === 0) return [];
  return periods.slice(used[0], used.at(-1)! + 1);
}

// The weekday a timetable opens on: today, or Monday at the weekend
export function shownWeekday(date: string): number {
  const weekday = isoWeekday(date);
  return weekday <= 5 ? weekday : 1;
}

// The school days of this week; at the weekend already the coming one
export function schoolWeek(date: string): SchoolDay[] {
  const weekday = isoWeekday(date);
  const monday = addDays(date, weekday <= 5 ? 1 - weekday : 8 - weekday);
  return SCHOOL_WEEKDAYS.map((day) => ({ weekday: day, date: addDays(monday, day - 1) }));
}

// The next day after `date` with lessons; the day after if the timetable is empty
export function nextSchoolDay(date: string, lessons: Lesson[]): string {
  for (let offset = 1; offset <= 7; offset++) {
    const day = addDays(date, offset);
    if (lessons.some((lesson) => lesson.weekday === isoWeekday(day))) return day;
  }
  return addDays(date, 1);
}

// When the last lesson of a weekday ends (minutes since midnight), null on a day without lessons
export function schoolEnd(weekday: number, lessons: Lesson[], periods: Period[]): number | null {
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

// The lessons of a subject on a date, as blocks: a double lesson counts once, at its first period.
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

// The lesson of a subject on a given date, used to suggest the period of an exam.
export function subjectLessonOn(
  subjectId: number,
  date: string,
  lessons: Lesson[],
  periods: Period[]
): LessonOccurrence | undefined {
  const block = subjectBlocksOn(subjectId, date, lessons, periods)[0];
  return block && { date, lesson: block.lesson, period: block.period };
}

// The remaining lessons of today, or all lessons of the next school day after school. Takes the
// time from useNow, so the screen shows the next lessons again as the day goes on.
export function nextLessons(lessons: Lesson[], periods: Period[], now: Now): LessonOccurrence[] {
  const remaining = lessonsOn(now.date, lessons, periods).filter(
    ({ date, period }) => lessonState(date, spanOf(period), now) !== "past"
  );
  if (remaining.length > 0) return remaining;
  return lessonsOn(nextSchoolDay(now.date, lessons), lessons, periods);
}
