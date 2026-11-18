import { type Column, getTableColumns } from "drizzle-orm";

import {
  entries,
  grades,
  lessons,
  periods,
  semesters,
  settings,
  subjects,
  teachers,
  type Entry,
  type Grade,
  type Lesson,
  type Period,
  type Semester,
  type Settings,
  type Subject,
  type Table,
  type Teacher,
} from "@/db/schema";
import { t } from "@/i18n";
import { today as currentDay } from "@/lib/dates";
import { completePastEvents } from "@/lib/entry-status";

// The file format of export and import. A timetable file holds what a class shares (period grid,
// teachers, subjects, lessons); a backup also holds the personal data (entries, grades,
// semesters, settings). Rows keep their database ids, so the references between them stay valid.
// Format 2 dropped the study start (entries.studyStart, the lead days in the settings): older
// files still import, their extra fields are dropped on import (src/db/data.ts); format 1 apps
// reject format 2 files with a hint to update instead of failing on the missing lead days.
// Format 2 also made every entry type checkable: past exams, presentations and other entries of a
// format 1 backup are imported as done, as the database migration 0005 does, so they do not
// return as missed. Export and import themselves live in src/db/data.ts, with the database.

export const TRANSFER_FORMAT = 2;

export type TransferKind = "timetable" | "backup";

type TimetableData = {
  periods: Period[];
  teachers: Teacher[];
  subjects: Subject[];
  lessons: Lesson[];
};

type PersonalData = {
  entries: Entry[];
  grades: Grade[];
  semesters: Semester[];
  settings: Settings;
};

export type TransferFile = { app: "SchoolOS"; format: number; exportedAt: string } & (
  ({ kind: "timetable" } & TimetableData) | ({ kind: "backup" } & TimetableData & PersonalData)
);

export class TransferError extends Error {}

const errors = t.transfer.errors;

const fail = (message: string): never => {
  throw new TransferError(message);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;

// A real calendar day as "YYYY-MM-DD"; Date.UTC rolls "2026-02-30" over, so it would not match.
function isDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().startsWith(value);
}

function checkRow(row: unknown, table: Table, name: string) {
  if (!isObject(row)) fail(errors.invalidRow(name));
  const fields = row as Record<string, unknown>;
  for (const [key, column] of Object.entries(getTableColumns(table)) as [string, Column][]) {
    const value = fields[key];
    if (!column.notNull && (value === null || value === undefined)) continue;
    const valid =
      typeof value === column.dataType &&
      (column.columnType !== "SQLiteInteger" || Number.isInteger(value));
    if (!valid) fail(errors.invalidField({ row: name, field: key }));
    if (column.enumValues && !column.enumValues.includes(value as string)) {
      fail(errors.invalidChoice({ row: name, value: String(value), field: key }));
    }
  }
}

function checkRows<T extends { id: number }>(
  value: unknown,
  table: Table,
  list: string,
  rowName: (position: number) => string,
  check: (row: T, name: string) => void = () => {}
): Set<number> {
  if (!Array.isArray(value)) fail(errors.missingList(list));
  const ids = new Set<number>();
  (value as unknown[]).forEach((row, index) => {
    const name = rowName(index + 1);
    checkRow(row, table, name);
    const { id } = row as T;
    if (id < 1) fail(errors.invalidId({ row: name, id }));
    if (ids.has(id)) fail(errors.duplicateId({ row: name, id }));
    ids.add(id);
    check(row as T, name);
  });
  return ids;
}

function checkTime(name: string, what: string, value: string) {
  if (!TIME.test(value)) fail(errors.invalidTime({ row: name, what, value }));
}

function checkDate(name: string, what: string, value: string | null | undefined) {
  if (value !== null && value !== undefined && !isDate(value)) {
    fail(errors.invalidDate({ row: name, what, value }));
  }
}

function checkReference(
  name: string,
  what: string,
  ids: Set<number>,
  id: number | null | undefined
) {
  if (id !== null && id !== undefined && !ids.has(id)) {
    fail(errors.missingReference({ row: name, what, id }));
  }
}

export function parseTransferFile(text: string, today: string = currentDay()): TransferFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new TransferError(errors.notSchoolOSFile);
  }
  if (!isObject(data) || data.app !== "SchoolOS") {
    throw new TransferError(errors.notSchoolOSFile);
  }
  if (typeof data.format !== "number" || !Number.isInteger(data.format) || data.format < 1) {
    throw new TransferError(errors.invalidFormat);
  }
  if (data.format > TRANSFER_FORMAT) {
    throw new TransferError(errors.newerFormat);
  }
  if (data.kind !== "timetable" && data.kind !== "backup") {
    throw new TransferError(errors.notSchoolOSFile);
  }

  const { lists, rows, fields } = t.transfer;
  const startTimes = new Set<string>();
  const slots = new Set<string>();
  const periodIds = checkRows<Period>(
    data.periods,
    periods,
    lists.periods,
    rows.period,
    (period, name) => {
      const { startTime, endTime } = period;
      checkTime(name, fields.periodStart, startTime);
      checkTime(name, fields.periodEnd, endTime);
      // "HH:MM" compares like the time it stands for
      if (startTime >= endTime) {
        fail(errors.periodNotBeforeEnd({ row: name, start: startTime, end: endTime }));
      }
      if (startTimes.has(startTime)) {
        fail(errors.duplicatePeriodStart({ row: name, start: startTime }));
      }
      startTimes.add(startTime);
    }
  );
  const teacherIds = checkRows<Teacher>(data.teachers, teachers, lists.teachers, rows.teacher);
  const subjectIds = checkRows<Subject>(
    data.subjects,
    subjects,
    lists.subjects,
    rows.subject,
    (subject, name) => {
      if (!COLOR.test(subject.color)) {
        fail(errors.invalidColor({ row: name, color: subject.color }));
      }
      checkReference(name, fields.teacher, teacherIds, subject.teacherId);
    }
  );
  checkRows<Lesson>(data.lessons, lessons, lists.lessons, rows.lesson, (lesson, name) => {
    if (lesson.weekday < 1 || lesson.weekday > 5) {
      fail(errors.invalidWeekday({ row: name, weekday: lesson.weekday }));
    }
    checkReference(name, fields.subject, subjectIds, lesson.subjectId);
    checkReference(name, fields.period, periodIds, lesson.periodId);
    const slot = `${lesson.weekday}-${lesson.periodId}`;
    if (slots.has(slot)) fail(errors.duplicateLesson(name));
    slots.add(slot);
  });

  if (data.kind === "backup") {
    const entryIds = checkRows<Entry>(
      data.entries,
      entries,
      lists.entries,
      rows.entry,
      (entry, name) => {
        checkDate(name, fields.date, entry.date);
        checkReference(name, fields.subject, subjectIds, entry.subjectId);
        checkReference(name, fields.period, periodIds, entry.periodId);
      }
    );
    checkRows<Grade>(data.grades, grades, lists.grades, rows.grade, (grade, name) => {
      if (grade.value < 1 || grade.value > 6) {
        fail(errors.gradeOutOfRange({ row: name, grade: grade.value }));
      }
      checkDate(name, fields.date, grade.date);
      checkReference(name, fields.subject, subjectIds, grade.subjectId);
      checkReference(name, fields.entry, entryIds, grade.entryId);
    });
    checkRows<Semester>(
      data.semesters,
      semesters,
      lists.semesters,
      rows.semester,
      (semester, name) => {
        checkDate(name, fields.semesterStart, semester.startDate);
        checkDate(name, fields.semesterEnd, semester.endDate);
      }
    );
    if (!isObject(data.settings)) fail(errors.missingList(lists.settings));
    checkRow(data.settings, settings, rows.settings);
    const fileSettings = data.settings as Settings;
    checkTime(rows.settings, fields.secondReminder, fileSettings.secondReminderTime);
    checkTime(rows.settings, fields.noLessonSummary, fileSettings.noLessonSummaryTime);
    if (data.format < 2) {
      data.entries = completePastEvents(data.entries as Entry[], today);
    }
  }

  return data as unknown as TransferFile;
}

// What a file holds, for the import confirmation: "8 periods per day, 12 subjects, …"
export function describeTransferFile(file: TransferFile): string {
  const { contents } = t.transfer;
  const parts = [
    contents.periods(file.periods.length),
    contents.subjects(file.subjects.length),
    contents.teachers(file.teachers.length),
    contents.lessons(file.lessons.length),
  ];
  if (file.kind === "backup") parts.push(contents.entries(file.entries.length));
  return t.common.list(parts);
}
