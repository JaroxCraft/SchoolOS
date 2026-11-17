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
import { today as currentDay } from "@/lib/dates";
import { completePastEvents } from "@/lib/entry-status";
import { countOf } from "@/lib/text";

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

export const NOT_A_SCHOOLOS_FILE =
  "Die Datei ist keine SchoolOS-Datei. Importieren lassen sich nur JSON-Dateien, die SchoolOS mit «Stundenplan teilen» oder «Backup sichern» erstellt hat, keine PDFs oder Bilder.";

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
  if (!isObject(row)) fail(`${name} ist ungültig.`);
  const fields = row as Record<string, unknown>;
  for (const [key, column] of Object.entries(getTableColumns(table)) as [string, Column][]) {
    const value = fields[key];
    if (!column.notNull && (value === null || value === undefined)) continue;
    const valid =
      typeof value === column.dataType &&
      (column.columnType !== "SQLiteInteger" || Number.isInteger(value));
    if (!valid) fail(`${name}: Die Angabe «${key}» fehlt oder ist ungültig.`);
    if (column.enumValues && !column.enumValues.includes(value as string)) {
      fail(`${name}: «${String(value)}» ist keine gültige Angabe für «${key}».`);
    }
  }
}

function checkRows<T extends { id: number }>(
  value: unknown,
  table: Table,
  plural: string,
  label: string,
  check: (row: T, name: string) => void = () => {}
): Set<number> {
  if (!Array.isArray(value)) fail(`Die Datei enthält keine ${plural}.`);
  const ids = new Set<number>();
  (value as unknown[]).forEach((row, index) => {
    const name = `${label} ${index + 1}`;
    checkRow(row, table, name);
    const { id } = row as T;
    if (id < 1) fail(`${name}: Die ID ${id} ist ungültig.`);
    if (ids.has(id)) fail(`${name}: Die ID ${id} kommt in der Datei mehrfach vor.`);
    ids.add(id);
    check(row as T, name);
  });
  return ids;
}

function checkTime(name: string, what: string, value: string) {
  if (!TIME.test(value)) fail(`${name}: ${what} «${value}» ist keine gültige Uhrzeit.`);
}

function checkDate(name: string, what: string, value: string | null | undefined) {
  if (value !== null && value !== undefined && !isDate(value)) {
    fail(`${name}: ${what} «${value}» ist kein gültiges Datum.`);
  }
}

function checkReference(
  name: string,
  what: string,
  ids: Set<number>,
  id: number | null | undefined
) {
  if (id !== null && id !== undefined && !ids.has(id)) {
    fail(`${name}: ${what} mit der ID ${id} fehlt in der Datei.`);
  }
}

export function parseTransferFile(text: string, today: string = currentDay()): TransferFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new TransferError(NOT_A_SCHOOLOS_FILE);
  }
  if (!isObject(data) || data.app !== "SchoolOS") {
    throw new TransferError(NOT_A_SCHOOLOS_FILE);
  }
  if (typeof data.format !== "number" || !Number.isInteger(data.format) || data.format < 1) {
    throw new TransferError("Die Dateiversion ist ungültig.");
  }
  if (data.format > TRANSFER_FORMAT) {
    throw new TransferError(
      "Die Datei stammt aus einer neueren Version von SchoolOS. Aktualisiere SchoolOS, um sie zu importieren."
    );
  }
  if (data.kind !== "timetable" && data.kind !== "backup") {
    throw new TransferError(NOT_A_SCHOOLOS_FILE);
  }

  const startTimes = new Set<string>();
  const slots = new Set<string>();
  const periodIds = checkRows<Period>(
    data.periods,
    periods,
    "Lektionszeiten",
    "Lektionszeit",
    (period, name) => {
      checkTime(name, "Beginn", period.startTime);
      checkTime(name, "Ende", period.endTime);
      // "HH:MM" compares like the time it stands for
      if (period.startTime >= period.endTime) {
        fail(`${name}: Beginn ${period.startTime} liegt nicht vor dem Ende ${period.endTime}.`);
      }
      if (startTimes.has(period.startTime)) {
        fail(`${name}: Eine Lektionszeit beginnt bereits um ${period.startTime}.`);
      }
      startTimes.add(period.startTime);
    }
  );
  const teacherIds = checkRows<Teacher>(data.teachers, teachers, "Lehrpersonen", "Lehrperson");
  const subjectIds = checkRows<Subject>(
    data.subjects,
    subjects,
    "Fächer",
    "Fach",
    (subject, name) => {
      if (!COLOR.test(subject.color)) {
        fail(`${name}: Die Farbe «${subject.color}» ist ungültig.`);
      }
      checkReference(name, "Die Lehrperson", teacherIds, subject.teacherId);
    }
  );
  checkRows<Lesson>(
    data.lessons,
    lessons,
    "Lektionen im Stundenplan",
    "Lektion",
    (lesson, name) => {
      if (lesson.weekday < 1 || lesson.weekday > 5) {
        fail(`${name}: Wochentag ${lesson.weekday} gibt es nicht.`);
      }
      checkReference(name, "Das Fach", subjectIds, lesson.subjectId);
      checkReference(name, "Die Lektionszeit", periodIds, lesson.periodId);
      const slot = `${lesson.weekday}-${lesson.periodId}`;
      if (slots.has(slot)) {
        fail(`${name}: Am selben Tag liegt zur selben Lektionszeit schon eine Lektion.`);
      }
      slots.add(slot);
    }
  );

  if (data.kind === "backup") {
    const entryIds = checkRows<Entry>(
      data.entries,
      entries,
      "Einträge",
      "Eintrag",
      (entry, name) => {
        checkDate(name, "Das Datum", entry.date);
        checkReference(name, "Das Fach", subjectIds, entry.subjectId);
        checkReference(name, "Die Lektionszeit", periodIds, entry.periodId);
      }
    );
    checkRows<Grade>(data.grades, grades, "Noten", "Note", (grade, name) => {
      if (grade.value < 1 || grade.value > 6) {
        fail(`${name}: Die Note ${grade.value} liegt nicht zwischen 1 und 6.`);
      }
      checkDate(name, "Das Datum", grade.date);
      checkReference(name, "Das Fach", subjectIds, grade.subjectId);
      checkReference(name, "Der Eintrag", entryIds, grade.entryId);
    });
    checkRows<Semester>(data.semesters, semesters, "Semester", "Semester", (semester, name) => {
      checkDate(name, "Der Beginn", semester.startDate);
      checkDate(name, "Das Ende", semester.endDate);
    });
    if (!isObject(data.settings)) fail("Die Datei enthält keine Einstellungen.");
    checkRow(data.settings, settings, "Einstellungen");
    const fileSettings = data.settings as Settings;
    checkTime("Einstellungen", "Die zweite Erinnerung", fileSettings.secondReminderTime);
    checkTime(
      "Einstellungen",
      "Die Zusammenfassung an freien Tagen",
      fileSettings.noLessonSummaryTime
    );
    if (data.format < 2) {
      data.entries = completePastEvents(data.entries as Entry[], today);
    }
  }

  return data as unknown as TransferFile;
}

export function describeTransferFile(file: TransferFile): string {
  const parts = [
    `${countOf(file.periods.length, "Lektionszeit", "Lektionszeiten")} pro Tag`,
    countOf(file.subjects.length, "Fach", "Fächer"),
    countOf(file.teachers.length, "Lehrperson", "Lehrpersonen"),
    `${countOf(file.lessons.length, "Lektion", "Lektionen")} im Stundenplan`,
  ];
  if (file.kind === "backup") parts.push(countOf(file.entries.length, "Eintrag", "Einträge"));
  return `${parts.slice(0, -1).join(", ")} und ${parts.at(-1)}`;
}
