import type { Lesson, Period } from "@/db/schema";
import { lessonAt } from "@/lib/schedule";

// Minutes since midnight of "07:25"
export function minutesOf(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// One card of the timetable: a lesson, or consecutive lessons of the same subject in the same room
// (a double lesson), which span the break between them like one event in Calendar.
export type LessonBlock = {
  key: string;
  subjectId: number;
  room: string | null;
  start: number;
  end: number;
  // Numbers of the first and last period (1-based)
  firstNumber: number;
  lastNumber: number;
};

// Periods must be sorted by start time (as returned by usePeriods).
export function lessonBlocks(lessons: Lesson[], periods: Period[], weekday: number): LessonBlock[] {
  const blocks: LessonBlock[] = [];
  periods.forEach((period, index) => {
    const lesson = lessonAt(lessons, weekday, period.id);
    if (!lesson) return;
    const previous = blocks.at(-1);
    if (
      previous &&
      previous.lastNumber === index &&
      previous.subjectId === lesson.subjectId &&
      previous.room === lesson.room
    ) {
      previous.end = minutesOf(period.endTime);
      previous.lastNumber = index + 1;
      return;
    }
    blocks.push({
      key: `${weekday}-${period.id}`,
      subjectId: lesson.subjectId,
      room: lesson.room,
      start: minutesOf(period.startTime),
      end: minutesOf(period.endTime),
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
