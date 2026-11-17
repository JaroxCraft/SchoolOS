/// <reference types="bun" />

import { describe, expect, test } from "bun:test";

import type { Lesson, Period } from "@/db/schema";
import { minutesOf } from "@/lib/dates";
import { type DueFields, dueChoiceDates, suggestDue } from "@/lib/due-date";

// 2026-11-16 is a Monday
const MONDAY = "2026-11-16";
const TUESDAY = "2026-11-17";
const MATH = 1;
const ART = 2;

const periods: Period[] = [
  { id: 11, startTime: "07:30", endTime: "08:15" },
  { id: 12, startTime: "08:20", endTime: "09:05" },
];

// Math on Monday and Tuesday in the second period, and on Thursday in the first
const lessons: Lesson[] = [
  { id: 1, weekday: 1, periodId: 12, subjectId: MATH, room: null },
  { id: 2, weekday: 2, periodId: 12, subjectId: MATH, room: null },
  { id: 3, weekday: 4, periodId: 11, subjectId: MATH, room: null },
];

const at = (date: string, time: string) => ({ date, minutes: minutesOf(time) });

const homework = (fields: Partial<DueFields>): DueFields => ({
  type: "homework",
  subjectId: MATH,
  dueChoice: "next",
  date: MONDAY,
  periodId: null,
  dateTouched: false,
  periodTouched: false,
  ...fields,
});

const exam = (fields: Partial<DueFields>): DueFields =>
  homework({ type: "exam", dueChoice: "custom", ...fields });

describe("homework", () => {
  test("is due tomorrow if the subject has no lessons, with no lesson after that", () => {
    const now = at(MONDAY, "07:00");
    for (const subjectId of [ART, null]) {
      for (const dueChoice of ["next", "afterNext"] as const) {
        expect(suggestDue(homework({ subjectId, dueChoice }), lessons, periods, now)).toEqual({
          date: TUESDAY,
          periodId: null,
        });
      }
      expect(dueChoiceDates(subjectId, lessons, periods, now)).toEqual({
        next: null,
        afterNext: null,
      });
    }
  });

  test("given in a lesson, is due at the following one or the one after", () => {
    const now = at(MONDAY, "08:30");
    expect(suggestDue(homework({}), lessons, periods, now)).toEqual({
      date: TUESDAY,
      periodId: 12,
    });
    expect(suggestDue(homework({ dueChoice: "afterNext" }), lessons, periods, now)).toEqual({
      date: "2026-11-19",
      periodId: 11,
    });
    expect(dueChoiceDates(MATH, lessons, periods, now)).toEqual({
      next: TUESDAY,
      afterNext: "2026-11-19",
    });
  });

  test("keeps a chosen date and period", () => {
    const fields = homework({ dueChoice: "custom", date: "2026-12-01", periodId: 11 });
    expect(suggestDue(fields, lessons, periods, at(MONDAY, "07:00"))).toEqual({
      date: "2026-12-01",
      periodId: 11,
    });
  });
});

describe("other entries", () => {
  test("an exam gets the first lesson of the subject from tomorrow on", () => {
    // Sunday evening: Monday's lesson is the first from tomorrow on
    expect(suggestDue(exam({}), lessons, periods, at("2026-11-15", "20:00"))).toEqual({
      date: MONDAY,
      periodId: 12,
    });
    // Monday before the lesson: today's does not count, the exam is announced ahead
    expect(suggestDue(exam({}), lessons, periods, at(MONDAY, "07:00"))).toEqual({
      date: TUESDAY,
      periodId: 12,
    });
  });

  test("without lessons it is tomorrow, without a period", () => {
    expect(suggestDue(exam({ subjectId: ART }), lessons, periods, at(MONDAY, "07:00"))).toEqual({
      date: TUESDAY,
      periodId: null,
    });
  });

  test("a touched date is kept and the period suggested for it", () => {
    const now = at(MONDAY, "07:00");
    expect(
      suggestDue(exam({ date: "2026-11-26", dateTouched: true }), lessons, periods, now)
    ).toEqual({ date: "2026-11-26", periodId: 11 });
    expect(
      suggestDue(exam({ date: "2026-11-25", dateTouched: true }), lessons, periods, now)
    ).toEqual({ date: "2026-11-25", periodId: null });
  });

  test("a touched period is kept", () => {
    const fields = exam({ periodId: 11, periodTouched: true });
    expect(suggestDue(fields, lessons, periods, at(MONDAY, "07:00"))).toEqual({
      date: TUESDAY,
      periodId: 11,
    });
  });
});
