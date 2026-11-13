import { type Column, getTableColumns } from "drizzle-orm";

import { db } from "@/db/client";
import {
  DATA_TABLES,
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
  type Teacher,
} from "@/db/schema";

// The file format of export and import. A timetable file holds what a class shares (period grid,
// teachers, subjects, lessons); a backup also holds the personal data (entries, grades,
// semesters, settings). Rows keep their database ids, so the references between them stay valid.

export const TRANSFER_FORMAT = 1;

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

type Table =
  | typeof periods
  | typeof teachers
  | typeof subjects
  | typeof lessons
  | typeof semesters
  | typeof entries
  | typeof grades
  | typeof settings;

export function exportData(kind: TransferKind): TransferFile {
  const header = { app: "SchoolOS", format: TRANSFER_FORMAT, exportedAt: new Date().toISOString() };
  const allLessons = db.select().from(lessons).all();
  const allSubjects = db.select().from(subjects).all();
  const allTeachers = db.select().from(teachers).all();

  if (kind === "timetable") {
    // Classmates get the subjects of the timetable only, not the ones someone keeps for grades
    const usedSubjectIds = new Set(allLessons.map((lesson) => lesson.subjectId));
    const sharedSubjects = allSubjects.filter((subject) => usedSubjectIds.has(subject.id));
    const usedTeacherIds = new Set(sharedSubjects.map((subject) => subject.teacherId));
    return {
      ...header,
      kind,
      periods: db.select().from(periods).all(),
      teachers: allTeachers.filter((teacher) => usedTeacherIds.has(teacher.id)),
      subjects: sharedSubjects,
      lessons: allLessons,
    } as TransferFile;
  }
  return {
    ...header,
    kind,
    periods: db.select().from(periods).all(),
    teachers: allTeachers,
    subjects: allSubjects,
    lessons: allLessons,
    entries: db.select().from(entries).all(),
    grades: db.select().from(grades).all(),
    semesters: db.select().from(semesters).all(),
    settings: db.select().from(settings).all()[0],
  } as TransferFile;
}

// Thrown for files that are not a valid SchoolOS export; the message is shown to the user.
export class TransferError extends Error {}

// Names the only supported format, since a PDF or photo of a timetable is the obvious first try
export const NOT_A_SCHOOLOS_FILE =
  "Die Datei ist keine SchoolOS-Datei. Importieren lassen sich nur JSON-Dateien, die SchoolOS mit «Stundenplan teilen» oder «Backup sichern» erstellt hat, keine PDFs oder Bilder.";

const fail = (message: string): never => {
  throw new TransferError(message);
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const COLOR = /^#[0-9A-Fa-f]{6}$/;
// The range the lead day picker in the settings offers
const MAX_LEAD_DAYS = 21;
// Rows per insert statement, so a large file stays below SQLite's limit of bound variables
const INSERT_CHUNK_SIZE = 500;

// A real calendar day as "YYYY-MM-DD"; Date.UTC rolls "2026-02-30" over, so it would not match.
function isDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.toISOString().startsWith(value);
}

// Checks a row against the columns of its table: required columns need a value of the right
// type, nullable ones may also be null or missing. `name` says which row it is ("Lektion 4").
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

// Checks the rows of a table and that no id appears twice; returns the ids for the references.
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

// `what` names the referenced row, e.g. "Das Fach"
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

// Parses and validates the text of an export file, so the import cannot fail on its content.
export function parseTransferFile(text: string): TransferFile {
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
    "Lektionen",
    "Lektionszeit",
    (period, name) => {
      checkTime(name, "Beginn", period.startTime);
      checkTime(name, "Ende", period.endTime);
      // "HH:MM" compares like the time it stands for
      if (period.startTime >= period.endTime) {
        fail(`${name}: Beginn ${period.startTime} liegt nicht vor dem Ende ${period.endTime}.`);
      }
      // A timetable import matches periods by their start time
      if (startTimes.has(period.startTime)) {
        fail(`${name}: Eine Lektion beginnt bereits um ${period.startTime}.`);
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
        checkDate(name, "Der Lernbeginn", entry.studyStart);
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
    checkTime("Einstellungen", "Die Übersicht", fileSettings.noLessonSummaryTime);
    for (const [key, what] of [
      ["examLeadDays", "Der Lernbeginn für Prüfungen"],
      ["presentationLeadDays", "Der Lernbeginn für Präsentationen"],
      ["submissionLeadDays", "Der Lernbeginn für Abgaben"],
    ] as const) {
      const days = fileSettings[key];
      if (!Number.isInteger(days) || days < 0 || days > MAX_LEAD_DAYS) {
        fail(`Einstellungen: ${what} (${days} Tage) liegt nicht zwischen 0 und ${MAX_LEAD_DAYS}.`);
      }
    }
  }

  return data as unknown as TransferFile;
}

// "11 Lektionen pro Tag, 14 Fächer, 8 Lehrpersonen und 35 Lektionen im Stundenplan"
export function describeTransferFile(file: TransferFile): string {
  const parts = [
    `${file.periods.length} Lektionen pro Tag`,
    `${file.subjects.length} Fächer`,
    `${file.teachers.length} Lehrpersonen`,
    `${file.lessons.length} Lektionen im Stundenplan`,
  ];
  if (file.kind === "backup") parts.push(`${file.entries.length} Einträge`);
  return `${parts.slice(0, -1).join(", ")} und ${parts.at(-1)}`;
}

// The values of a row for its table: fields the table does not have are dropped, missing
// nullable ones become null.
function columnValues<T extends Table>(table: T, row: object): T["$inferInsert"] {
  return Object.fromEntries(
    Object.keys(getTableColumns(table)).map((key) => [
      key,
      (row as Record<string, unknown>)[key] ?? null,
    ])
  ) as T["$inferInsert"];
}

// Replaces the data with the content of the file in one transaction, so a failing import leaves
// everything as it was. A timetable file keeps entries, grades and semesters: entries and grades
// move to the imported subject and period with the same name and start time. Old subjects that
// are not in the file but still have grades stay (without lessons), so no grade is lost; other
// entries lose their subject or period ("Allgemein").
export function importData(file: TransferFile) {
  db.transaction((tx) => {
    const insert = <T extends Table>(table: T, rows: object[]) => {
      for (let start = 0; start < rows.length; start += INSERT_CHUNK_SIZE) {
        tx.insert(table)
          .values(
            rows
              .slice(start, start + INSERT_CHUNK_SIZE)
              .map((row) => columnValues(table, row)) as T["$inferInsert"][]
          )
          .run();
      }
    };

    if (file.kind === "backup") {
      for (const table of DATA_TABLES) {
        tx.delete(table).run();
      }
      insert(periods, file.periods);
      insert(teachers, file.teachers);
      insert(subjects, file.subjects);
      insert(lessons, file.lessons);
      insert(semesters, file.semesters);
      insert(entries, file.entries);
      insert(grades, file.grades);
      const { id: _id, ...values } = columnValues(settings, file.settings);
      tx.update(settings).set(values).run();
      return;
    }

    // Matched before the old rows are deleted
    const oldEntries = tx.select().from(entries).all();
    const oldGrades = tx.select().from(grades).all();
    const gradedSubjectIds = new Set(oldGrades.map((grade) => grade.subjectId));
    const importedSubjectIds = new Map(file.subjects.map((subject) => [subject.name, subject.id]));
    const importedPeriodIds = new Map(file.periods.map((period) => [period.startTime, period.id]));

    // Old subject id → id after the import. Kept subjects get ids after the imported ones and
    // lose their teacher, since all old teachers are replaced.
    const subjectIds = new Map<number, number>();
    const keptSubjects: Subject[] = [];
    let nextSubjectId = Math.max(0, ...file.subjects.map((subject) => subject.id)) + 1;
    for (const subject of tx.select().from(subjects).all()) {
      const importedId = importedSubjectIds.get(subject.name);
      if (importedId !== undefined) {
        subjectIds.set(subject.id, importedId);
      } else if (gradedSubjectIds.has(subject.id)) {
        keptSubjects.push({ ...subject, id: nextSubjectId, teacherId: null });
        subjectIds.set(subject.id, nextSubjectId++);
      }
    }
    const periodIds = new Map(
      tx
        .select()
        .from(periods)
        .all()
        .flatMap((period) => {
          const importedId = importedPeriodIds.get(period.startTime);
          return importedId === undefined ? [] : [[period.id, importedId] as const];
        })
    );

    // Semesters do not depend on the timetable and stay
    for (const table of DATA_TABLES.filter((table) => table !== semesters)) {
      tx.delete(table).run();
    }
    insert(periods, file.periods);
    insert(teachers, file.teachers);
    insert(subjects, [...file.subjects, ...keptSubjects]);
    insert(lessons, file.lessons);
    insert(
      entries,
      oldEntries.map((entry) => ({
        ...entry,
        subjectId: entry.subjectId === null ? null : (subjectIds.get(entry.subjectId) ?? null),
        periodId: entry.periodId === null ? null : (periodIds.get(entry.periodId) ?? null),
      }))
    );
    // Every graded subject is either matched or kept
    insert(
      grades,
      oldGrades.map((grade) => ({ ...grade, subjectId: subjectIds.get(grade.subjectId)! }))
    );
  });
}
