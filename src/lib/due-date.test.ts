/// <reference types="bun" />

import { expect, test } from "bun:test";

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

const fields = (changes: Partial<DueFields>): DueFields => ({
  subjectId: MATH,
  dueChoice: "next",
  date: MONDAY,
  periodId: null,
  periodPickedByUser: false,
  ...changes,
});

test("without lessons of the subject it is due tomorrow, with no lesson after that", () => {
  const now = at(MONDAY, "07:00");
  for (const subjectId of [ART, null]) {
    for (const dueChoice of ["next", "afterNext"] as const) {
      expect(suggestDue(fields({ subjectId, dueChoice }), lessons, periods, now)).toEqual({
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

test("a lesson later today is the next one", () => {
  expect(suggestDue(fields({}), lessons, periods, at(MONDAY, "07:00"))).toEqual({
    date: MONDAY,
    periodId: 12,
  });
});

test("given in a lesson, it is due at the following one or the one after", () => {
  const now = at(MONDAY, "08:30");
  expect(suggestDue(fields({}), lessons, periods, now)).toEqual({ date: TUESDAY, periodId: 12 });
  expect(suggestDue(fields({ dueChoice: "afterNext" }), lessons, periods, now)).toEqual({
    date: "2026-11-19",
    periodId: 11,
  });
  expect(dueChoiceDates(MATH, lessons, periods, now)).toEqual({
    next: TUESDAY,
    afterNext: "2026-11-19",
  });
});

test("a chosen date is kept and gets the subject's lesson on it", () => {
  const now = at(MONDAY, "07:00");
  const custom = (date: string) => fields({ dueChoice: "custom", date, periodId: 12 });
  expect(suggestDue(custom("2026-11-26"), lessons, periods, now)).toEqual({
    date: "2026-11-26",
    periodId: 11,
  });
  expect(suggestDue(custom("2026-11-25"), lessons, periods, now)).toEqual({
    date: "2026-11-25",
    periodId: null,
  });
});

test("a Lektion picked for a chosen date is kept", () => {
  const picked = fields({
    dueChoice: "custom",
    date: "2026-12-01",
    periodId: 11,
    periodPickedByUser: true,
  });
  expect(suggestDue(picked, lessons, periods, at(MONDAY, "07:00"))).toEqual({
    date: "2026-12-01",
    periodId: 11,
  });
});
