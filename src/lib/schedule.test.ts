/// <reference types="bun" />

import { describe, expect, test } from "bun:test";

import type { Lesson, Period } from "@/db/schema";
import { minutesOf } from "@/lib/dates";
import {
  lessonBlocks,
  lessonState,
  nextLessons,
  nextSchoolDay,
  periodNumber,
  schoolEnd,
  schoolWeek,
  shownWeekday,
  subjectLessonOn,
  upcomingSubjectLessons,
  visiblePeriods,
} from "@/lib/schedule";

// 2026-11-16 is a Monday
const MONDAY = "2026-11-16";
const TUESDAY = "2026-11-17";
const THURSDAY = "2026-11-19";
const MATH = 1;
const GERMAN = 2;

// The third period follows a break
const periods: Period[] = [
  { id: 11, startTime: "07:30", endTime: "08:15" },
  { id: 12, startTime: "08:20", endTime: "09:05" },
  { id: 13, startTime: "09:25", endTime: "10:10" },
  { id: 14, startTime: "10:15", endTime: "11:00" },
];

let nextId = 1;
const lesson = (weekday: number, periodId: number, subjectId: number, room: string | null) => ({
  id: nextId++,
  weekday,
  periodId,
  subjectId,
  room,
});

// Monday: a math double lesson across the break, then German. Tuesday: math twice in a row but in
// different rooms. Wednesday and Friday are free; Thursday has German.
const lessons: Lesson[] = [
  lesson(1, 12, MATH, "A1"),
  lesson(1, 13, MATH, "A1"),
  lesson(1, 14, GERMAN, "B2"),
  lesson(2, 11, MATH, "A1"),
  lesson(2, 12, MATH, "C3"),
  lesson(4, 11, GERMAN, "B2"),
];

const at = (date: string, time: string) => ({ date, minutes: minutesOf(time) });

describe("double lessons", () => {
  test("consecutive periods in the same room are one block across the break", () => {
    const blocks = lessonBlocks(lessons, periods, 1);
    expect(
      blocks.map(({ lesson, start, end, firstNumber, lastNumber }) => ({
        subjectId: lesson.subjectId,
        start,
        end,
        firstNumber,
        lastNumber,
      }))
    ).toEqual([
      { subjectId: MATH, start: 8 * 60 + 20, end: 10 * 60 + 10, firstNumber: 2, lastNumber: 3 },
      { subjectId: GERMAN, start: 10 * 60 + 15, end: 11 * 60, firstNumber: 4, lastNumber: 4 },
    ]);
  });

  test("a different room makes two lessons", () => {
    expect(lessonBlocks(lessons, periods, 2).map((block) => block.lesson.room)).toEqual([
      "A1",
      "C3",
    ]);
    expect(
      upcomingSubjectLessons(MATH, lessons, periods, 2, at(TUESDAY, "07:00")).map(
        ({ period }) => period.id
      )
    ).toEqual([11, 12]);
  });

  test("a double lesson counts once, at its first period", () => {
    const upcoming = upcomingSubjectLessons(MATH, lessons, periods, 2, at(MONDAY, "07:00"));
    expect(upcoming.map(({ date, period }) => [date, period.id])).toEqual([
      [MONDAY, 12],
      [TUESDAY, 11],
    ]);
    expect(subjectLessonOn(MATH, MONDAY, lessons, periods)?.period.id).toBe(12);
  });
});

describe("upcoming lessons of a subject", () => {
  test("a lesson later today counts", () => {
    const [next] = upcomingSubjectLessons(GERMAN, lessons, periods, 1, at(MONDAY, "09:00"));
    expect([next.date, next.period.id]).toEqual([MONDAY, 14]);
  });

  test("the lesson in progress does not count", () => {
    const [next] = upcomingSubjectLessons(MATH, lessons, periods, 1, at(MONDAY, "08:20"));
    expect([next.date, next.period.id]).toEqual([TUESDAY, 11]);
  });

  test("a subject without lessons has none", () => {
    expect(upcomingSubjectLessons(99, lessons, periods, 2, at(MONDAY, "07:00"))).toEqual([]);
  });
});

describe("next lessons", () => {
  test("today's remaining ones, including the one in progress", () => {
    const next = nextLessons(lessons, periods, at(MONDAY, "10:30"));
    expect(next.map(({ date, period }) => [date, period.id])).toEqual([[MONDAY, 14]]);
  });

  test("after school those of the next school day, skipping days without lessons", () => {
    const next = nextLessons(lessons, periods, at(TUESDAY, "09:05"));
    expect(next.map(({ date, period }) => [date, period.id])).toEqual([[THURSDAY, 11]]);
  });
});

describe("school days", () => {
  test("the next school day skips days without lessons", () => {
    expect(nextSchoolDay(TUESDAY, lessons)).toBe(THURSDAY);
    expect(nextSchoolDay(THURSDAY, lessons)).toBe("2026-11-23");
  });

  test("school ends with the last lesson of the weekday", () => {
    expect(schoolEnd(1, lessons, periods)).toBe(11 * 60);
    expect(schoolEnd(2, lessons, periods)).toBe(9 * 60 + 5);
    expect(schoolEnd(3, lessons, periods)).toBeNull();
  });

  test("the timetable shows the current week, at the weekend the coming one from Monday", () => {
    expect(shownWeekday("2026-11-18")).toBe(3);
    expect(schoolWeek("2026-11-18")[0]).toEqual({ weekday: 1, date: MONDAY });
    expect(shownWeekday("2026-11-22")).toBe(1);
    expect(schoolWeek("2026-11-21")).toEqual([
      { weekday: 1, date: "2026-11-23" },
      { weekday: 2, date: "2026-11-24" },
      { weekday: 3, date: "2026-11-25" },
      { weekday: 4, date: "2026-11-26" },
      { weekday: 5, date: "2026-11-27" },
    ]);
  });
});

test("an empty timetable has no lessons, blocks or school days", () => {
  const now = at(MONDAY, "07:00");
  expect(nextLessons([], periods, now)).toEqual([]);
  expect(upcomingSubjectLessons(MATH, [], periods, 2, now)).toEqual([]);
  expect(lessonBlocks([], periods, 1)).toEqual([]);
  expect(visiblePeriods([], periods)).toEqual([]);
  expect(schoolEnd(1, [], periods)).toBeNull();
  expect(nextSchoolDay(MONDAY, [])).toBe(TUESDAY);
});

test("a lesson is past, current or upcoming only on today", () => {
  const span = { start: 8 * 60, end: 9 * 60 };
  expect(lessonState(MONDAY, span, at(MONDAY, "07:59"))).toBe("upcoming");
  expect(lessonState(MONDAY, span, at(MONDAY, "08:00"))).toBe("current");
  expect(lessonState(MONDAY, span, at(MONDAY, "09:00"))).toBe("past");
  expect(lessonState(TUESDAY, span, at(MONDAY, "10:00"))).toBe("upcoming");
});

test("periods are numbered from 1 in the order of the grid", () => {
  expect(periodNumber(periods, 13)).toBe(3);
  expect(visiblePeriods(lessons, periods)).toEqual(periods);
});
