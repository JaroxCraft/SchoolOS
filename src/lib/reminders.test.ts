/// <reference types="bun" />

import { expect, test } from "bun:test";

import type { Entry, Lesson, Period, Settings, Subject } from "@/db/schema";
import { addDays, toISODate } from "@/lib/dates";
import { planReminders } from "@/lib/reminders";

const MONDAY = "2026-11-16";
const MATH = 1;

const periods: Period[] = [
  { id: 11, startTime: "07:30", endTime: "08:15" },
  { id: 12, startTime: "08:20", endTime: "09:05" },
];
const subjects: Subject[] = [
  { id: MATH, name: "Mathe", abbreviation: "M", color: "#ff0000", teacherId: null },
];
// Math Monday to Thursday; Friday and the weekend are free
const lessons: Lesson[] = ([1, 2, 3, 4] as const).map((weekday) => ({
  id: weekday,
  weekday,
  periodId: weekday % 2 === 0 ? 12 : 11,
  subjectId: MATH,
  room: null,
}));
const settings: Settings = {
  id: 1,
  notificationsEnabled: true,
  secondReminderTime: "18:00",
  noLessonSummaryTime: "10:00",
};

// Several entries of every kind due on each of the coming four weeks' days
let nextId = 1;
const entries: Entry[] = Array.from({ length: 28 }, (_, offset) => addDays(MONDAY, offset)).flatMap(
  (date) =>
    (["homework", "exam", "homework"] as const).map((type) => ({
      id: nextId++,
      type,
      title: `${type} ${date}`,
      description: null,
      date,
      periodId: null,
      subjectId: MATH,
      completed: false,
      topic: null,
    }))
);

test("a day never gets more than two reminders", () => {
  const plan = planReminders({
    entries,
    lessons,
    periods,
    subjects,
    settings,
    now: new Date(2026, 10, 16, 6, 0),
  });
  const perDay = new Map<string, number>();
  for (const reminder of plan) {
    const day = toISODate(reminder.date);
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
  }
  // Every day, school day or weekend, has something due and gets both reminders, but no more
  expect(perDay.size).toBe(21);
  expect(Math.max(...perDay.values())).toBe(2);
  expect(Math.min(...perDay.values())).toBe(2);
});
