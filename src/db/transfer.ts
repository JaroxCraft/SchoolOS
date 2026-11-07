import { db } from "@/db/client";
import {
  ENTRY_TYPES,
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

export function exportData(kind: TransferKind): TransferFile {
  const timetable: TimetableData = {
    periods: db.select().from(periods).all(),
    teachers: db.select().from(teachers).all(),
    subjects: db.select().from(subjects).all(),
    lessons: db.select().from(lessons).all(),
  };
  const header = { app: "SchoolOS", format: TRANSFER_FORMAT, exportedAt: new Date().toISOString() };

  if (kind === "timetable") return { ...header, kind, ...timetable } as TransferFile;
  return {
    ...header,
    kind,
    ...timetable,
    entries: db.select().from(entries).all(),
    grades: db.select().from(grades).all(),
    semesters: db.select().from(semesters).all(),
    settings: db.select().from(settings).all()[0],
  } as TransferFile;
}

// Thrown for files that are not a SchoolOS export; the message is shown to the user.
export class TransferError extends Error {}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

type FieldType = "number" | "string" | "boolean";

// Checks that every row has the fields of its table with the right types; optional fields may
// also be null or missing.
function checkRows(
  value: unknown,
  name: string,
  required: Record<string, FieldType>,
  optional: Record<string, FieldType> = {}
) {
  if (!Array.isArray(value)) throw new TransferError(`Die Datei enthält keine ${name}.`);
  for (const row of value) {
    const valid =
      isObject(row) &&
      Object.entries(required).every(([key, type]) => typeof row[key] === type) &&
      Object.entries(optional).every(
        ([key, type]) => row[key] === null || row[key] === undefined || typeof row[key] === type
      );
    if (!valid) throw new TransferError(`Die ${name} in der Datei sind unvollständig.`);
  }
}

const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

// Parses and validates the text of an export file.
export function parseTransferFile(text: string): TransferFile {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new TransferError("Die Datei ist keine SchoolOS-Datei.");
  }
  if (!isObject(data) || data.app !== "SchoolOS") {
    throw new TransferError("Die Datei ist keine SchoolOS-Datei.");
  }
  if (typeof data.format !== "number" || !Number.isInteger(data.format) || data.format < 1) {
    throw new TransferError("Die Dateiversion ist ungültig.");
  }
  if (data.format > TRANSFER_FORMAT) {
    throw new TransferError("Die Datei stammt aus einer neueren Version von SchoolOS.");
  }
  if (data.kind !== "timetable" && data.kind !== "backup") {
    throw new TransferError("Die Datei ist keine SchoolOS-Datei.");
  }

  checkRows(data.periods, "Lektionen", { id: "number", startTime: "string", endTime: "string" });
  checkRows(
    data.teachers,
    "Lehrpersonen",
    { id: "number", name: "string", abbreviation: "string" },
    { email: "string" }
  );
  checkRows(
    data.subjects,
    "Fächer",
    { id: "number", name: "string", abbreviation: "string", color: "string" },
    { teacherId: "number" }
  );
  checkRows(
    data.lessons,
    "Lektionen im Stundenplan",
    { id: "number", weekday: "number", periodId: "number", subjectId: "number" },
    { room: "string" }
  );
  const periodRows = data.periods as Period[];
  if (periodRows.some((period) => !TIME.test(period.startTime) || !TIME.test(period.endTime))) {
    throw new TransferError("Die Zeiten der Lektionen in der Datei sind ungültig.");
  }

  if (data.kind === "backup") {
    checkRows(
      data.entries,
      "Einträge",
      { id: "number", type: "string", title: "string", date: "string", completed: "boolean" },
      {
        description: "string",
        periodId: "number",
        subjectId: "number",
        studyStart: "string",
        topic: "string",
      }
    );
    checkRows(
      data.grades,
      "Noten",
      { id: "number", value: "number", weight: "number", date: "string", subjectId: "number" },
      { note: "string", entryId: "number" }
    );
    checkRows(data.semesters, "Semester", {
      id: "number",
      name: "string",
      startDate: "string",
      endDate: "string",
    });
    checkRows([data.settings], "Einstellungen", {
      examLeadDays: "number",
      presentationLeadDays: "number",
      submissionLeadDays: "number",
      notificationsEnabled: "boolean",
      secondReminderTime: "string",
      noLessonSummaryTime: "string",
    });
    const entryRows = data.entries as Entry[];
    if (
      entryRows.some(
        (entry) =>
          !(ENTRY_TYPES as readonly string[]).includes(entry.type) || !DATE.test(entry.date)
      )
    ) {
      throw new TransferError("Die Einträge in der Datei sind ungültig.");
    }
  }

  return data as unknown as TransferFile;
}

// "11 Lektionen, 14 Fächer, 8 Lehrpersonen und 35 Lektionen im Stundenplan"
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

// Replaces the data with the content of the file in one transaction, so a failing import leaves
// everything as it was. A timetable file keeps the entries: they are moved to the imported
// subjects and periods with the same name and start time, the others become "Allgemein".
export function importData(file: TransferFile) {
  db.transaction((tx) => {
    const insert = <T extends Record<string, unknown>>(
      table: Parameters<typeof tx.insert>[0],
      rows: T[]
    ) => {
      if (rows.length > 0) tx.insert(table).values(rows).run();
    };

    // Matched before the old rows are deleted
    const subjectNames = new Map(
      tx
        .select()
        .from(subjects)
        .all()
        .map((subject) => [subject.id, subject.name])
    );
    const periodStarts = new Map(
      tx
        .select()
        .from(periods)
        .all()
        .map((period) => [period.id, period.startTime])
    );
    const keptEntries =
      file.kind === "timetable"
        ? tx
            .select()
            .from(entries)
            .all()
            .map((entry) => ({
              ...entry,
              subjectId:
                file.subjects.find((subject) => subject.name === subjectNames.get(entry.subjectId!))
                  ?.id ?? null,
              periodId:
                file.periods.find(
                  (period) => period.startTime === periodStarts.get(entry.periodId!)
                )?.id ?? null,
            }))
        : [];
    const keptGrades = file.kind === "timetable" ? tx.select().from(grades).all() : [];
    const keptSemesters = file.kind === "timetable" ? tx.select().from(semesters).all() : [];

    // Children before the rows they reference
    for (const table of [grades, entries, lessons, subjects, teachers, periods, semesters]) {
      tx.delete(table).run();
    }

    insert(
      periods,
      file.periods.map(({ id, startTime, endTime }) => ({ id, startTime, endTime }))
    );
    insert(
      teachers,
      file.teachers.map(({ id, name, abbreviation, email }) => ({
        id,
        name,
        abbreviation,
        email: email ?? null,
      }))
    );
    const teacherIds = new Set(file.teachers.map((teacher) => teacher.id));
    insert(
      subjects,
      file.subjects.map(({ id, name, abbreviation, color, teacherId }) => ({
        id,
        name,
        abbreviation,
        color,
        teacherId: teacherId !== null && teacherIds.has(teacherId) ? teacherId : null,
      }))
    );
    insert(
      lessons,
      file.lessons.map(({ id, weekday, periodId, subjectId, room }) => ({
        id,
        weekday,
        periodId,
        subjectId,
        room: room ?? null,
      }))
    );

    if (file.kind === "backup") {
      insert(semesters, file.semesters);
      insert(
        entries,
        file.entries.map((entry) => ({
          ...entry,
          description: entry.description ?? null,
          periodId: entry.periodId ?? null,
          subjectId: entry.subjectId ?? null,
          studyStart: entry.studyStart ?? null,
          topic: entry.topic ?? null,
        }))
      );
      insert(
        grades,
        file.grades.map((grade) => ({
          ...grade,
          note: grade.note ?? null,
          entryId: grade.entryId ?? null,
        }))
      );
      const { id: _id, ...values } = file.settings;
      tx.update(settings).set(values).run();
    } else {
      insert(semesters, keptSemesters);
      insert(entries, keptEntries);
      // Grades of subjects that are not in the file go with their subject
      const subjectByName = new Map(file.subjects.map((subject) => [subject.name, subject.id]));
      const unmatchedGrades = keptGrades.filter(
        (grade) => !subjectByName.has(subjectNames.get(grade.subjectId) ?? "")
      );
      let generalSubjectId: number | undefined;
      if (unmatchedGrades.length > 0) {
        generalSubjectId = Math.max(0, ...file.subjects.map(({ id }) => id)) + 1;
        insert(subjects, [
          {
            id: generalSubjectId,
            name: "Allgemein",
            abbreviation: "Allg.",
            color: "#8E8E93",
            teacherId: null,
          },
        ]);
      }
      insert(
        grades,
        keptGrades.map((grade) => ({
          ...grade,
          subjectId:
            subjectByName.get(subjectNames.get(grade.subjectId) ?? "") ?? generalSubjectId!,
        }))
      );
    }
  });
}
