/// <reference types="bun" />
import { describe, expect, test } from "bun:test";

import { dataOperations } from "@/db/data";
import type { Database } from "@/db/database";
import {
  entries,
  grades,
  lessons,
  periods,
  semesters,
  settings,
  SETTINGS_ID,
  subjects,
  teachers,
  type Entry,
} from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { parseTransferFile, TransferError, type TransferFile } from "@/db/transfer";

const TODAY = "2026-11-17";

// A database as after the first launch, with its operations
function setup() {
  const db = createTestDatabase();
  return { db, ...dataOperations(db) };
}

function entry(values: Partial<Entry> & Pick<Entry, "id" | "title">): Entry {
  return {
    type: "homework",
    description: null,
    date: "2026-11-20",
    periodId: null,
    subjectId: null,
    completed: false,
    topic: null,
    ...values,
  };
}

// Two periods, two teachers, Mathe and Deutsch in the timetable, Bio only kept for its grade
function seedBackup(db: Database) {
  db.insert(periods)
    .values([
      { id: 1, startTime: "08:00", endTime: "08:45" },
      { id: 2, startTime: "08:50", endTime: "09:35" },
    ])
    .run();
  db.insert(teachers)
    .values([
      { id: 1, name: "Anna Muster", abbreviation: "MUA", email: "anna@example.ch" },
      { id: 2, name: "Beat Beispiel", abbreviation: "BEB", email: null },
      { id: 3, name: "Carla Clever", abbreviation: "CLC", email: null },
    ])
    .run();
  db.insert(subjects)
    .values([
      { id: 1, name: "Mathe", abbreviation: "M", color: "#FF0000", teacherId: 1 },
      { id: 2, name: "Deutsch", abbreviation: "D", color: "#00FF00", teacherId: 2 },
      { id: 3, name: "Bio", abbreviation: "B", color: "#0000FF", teacherId: 3 },
    ])
    .run();
  db.insert(lessons)
    .values([
      { id: 1, weekday: 1, periodId: 1, subjectId: 1, room: "A1" },
      { id: 2, weekday: 2, periodId: 2, subjectId: 2, room: null },
    ])
    .run();
  db.insert(semesters)
    .values({ id: 1, name: "HS 2026", startDate: "2026-08-17", endDate: "2027-01-29" })
    .run();
  db.insert(entries)
    .values([
      entry({ id: 1, title: "Aufgaben S. 12", subjectId: 1, periodId: 1, completed: true }),
      entry({ id: 2, title: "Prüfung", type: "exam", subjectId: 3, date: "2026-11-02" }),
    ])
    .run();
  db.insert(grades)
    .values({
      id: 1,
      value: 5.5,
      weight: 2,
      date: "2026-11-02",
      note: null,
      subjectId: 3,
      entryId: 2,
    })
    .run();
  db.update(settings).set({ notificationsEnabled: false, secondReminderTime: "19:30" }).run();
}

function contents(db: Database) {
  return {
    periods: db.select().from(periods).all(),
    teachers: db.select().from(teachers).all(),
    subjects: db.select().from(subjects).all(),
    lessons: db.select().from(lessons).all(),
    semesters: db.select().from(semesters).all(),
    entries: db.select().from(entries).all(),
    grades: db.select().from(grades).all(),
    settings: db.select().from(settings).all(),
  };
}

describe("backup", () => {
  test("export, parse and import restore every row and replace what was there", () => {
    const source = setup();
    seedBackup(source.db);
    const file = parseTransferFile(JSON.stringify(source.exportData("backup")), TODAY);

    const target = setup();
    target.db.insert(periods).values({ id: 7, startTime: "13:00", endTime: "13:45" }).run();
    target.db
      .insert(entries)
      .values(entry({ id: 9, title: "Alt" }))
      .run();
    target.importData(file);

    expect(contents(target.db)).toEqual(contents(source.db));
  });

  test("a format 1 backup imports past exams as done, homework stays open", () => {
    const source = setup();
    source.db
      .insert(entries)
      .values([
        entry({ id: 1, title: "Alte Hausaufgabe", date: "2026-11-10" }),
        entry({ id: 2, title: "Alte Prüfung", type: "exam", date: "2026-11-10" }),
        entry({ id: 3, title: "Neue Prüfung", type: "exam", date: "2026-11-24" }),
      ])
      .run();
    // Format 1 still had the study start, which the import drops
    const file = source.exportData("backup") as Extract<TransferFile, { kind: "backup" }>;
    const formatOne = {
      ...file,
      format: 1,
      entries: file.entries.map((row) => ({ ...row, studyStart: null })),
      settings: { ...file.settings, studyLeadDays: 3 },
    };

    const target = setup();
    target.importData(parseTransferFile(JSON.stringify(formatOne), TODAY));

    const completed = target.db
      .select()
      .from(entries)
      .all()
      .map(({ title, completed }) => [title, completed]);
    expect(completed).toEqual([
      ["Alte Hausaufgabe", false],
      ["Alte Prüfung", true],
      ["Neue Prüfung", false],
    ]);
  });
});

describe("timetable", () => {
  test("the export holds only subjects with lessons and their teachers", () => {
    const { db, exportData } = setup();
    seedBackup(db);
    const file = exportData("timetable");

    expect(file.kind).toBe("timetable");
    expect(file.subjects.map((subject) => subject.name)).toEqual(["Mathe", "Deutsch"]);
    expect(file.teachers.map((teacher) => teacher.name)).toEqual(["Anna Muster", "Beat Beispiel"]);
    expect(file.lessons).toHaveLength(2);
    expect(file.periods).toHaveLength(2);
    expect("entries" in file).toBe(false);
  });

  // A classmate's timetable: other ids, a new first period, Deutsch and Mathe but no Bio or Chemie
  function classmateTimetable() {
    const classmate = setup();
    classmate.db
      .insert(periods)
      .values([
        { id: 1, startTime: "07:10", endTime: "07:55" },
        { id: 2, startTime: "08:00", endTime: "08:45" },
      ])
      .run();
    classmate.db
      .insert(teachers)
      .values({ id: 1, name: "Dora Deutsch", abbreviation: "DED", email: null })
      .run();
    classmate.db
      .insert(subjects)
      .values([
        { id: 1, name: "Deutsch", abbreviation: "D", color: "#00FF00", teacherId: 1 },
        { id: 2, name: "Mathe", abbreviation: "Ma", color: "#FF8800", teacherId: null },
      ])
      .run();
    classmate.db
      .insert(lessons)
      .values([
        { id: 1, weekday: 3, periodId: 1, subjectId: 1, room: null },
        { id: 2, weekday: 4, periodId: 2, subjectId: 2, room: "B2" },
      ])
      .run();
    return parseTransferFile(JSON.stringify(classmate.exportData("timetable")), TODAY);
  }

  function importClassmateTimetable() {
    const own = setup();
    seedBackup(own.db);
    own.db
      .insert(subjects)
      .values({ id: 4, name: "Chemie", abbreviation: "C", color: "#888888", teacherId: null })
      .run();
    own.db
      .insert(entries)
      .values([
        entry({ id: 3, title: "Aufsatz", subjectId: 2, periodId: 2 }),
        entry({ id: 4, title: "Laborbericht", subjectId: 4, periodId: 1 }),
      ])
      .run();
    own.importData(classmateTimetable());
    return own.db;
  }

  test("replaces grid, teachers, subjects and lessons with the file", () => {
    const db = importClassmateTimetable();

    expect(
      db
        .select()
        .from(periods)
        .all()
        .map((period) => period.startTime)
    ).toEqual(["07:10", "08:00"]);
    expect(
      db
        .select()
        .from(teachers)
        .all()
        .map((teacher) => teacher.name)
    ).toEqual(["Dora Deutsch"]);
    expect(db.select().from(lessons).all()).toEqual([
      { id: 1, weekday: 3, periodId: 1, subjectId: 1, room: null },
      { id: 2, weekday: 4, periodId: 2, subjectId: 2, room: "B2" },
    ]);
    expect(db.select().from(semesters).all()).toHaveLength(1);
  });

  test("entries and grades move to the subject and period with the same name and start", () => {
    const db = importClassmateTimetable();
    const byTitle = new Map(
      db
        .select()
        .from(entries)
        .all()
        .map((row) => [row.title, row])
    );

    // Mathe in the 08:00 period is subject 2 and period 2 of the file
    expect(byTitle.get("Aufgaben S. 12")).toMatchObject({
      subjectId: 2,
      periodId: 2,
      completed: true,
    });
    // Deutsch is matched, the 08:50 period is not in the file
    expect(byTitle.get("Aufsatz")).toMatchObject({ subjectId: 1, periodId: null });
  });

  test("a graded subject missing from the file stays, without teacher and lessons", () => {
    const db = importClassmateTimetable();
    const bio = db
      .select()
      .from(subjects)
      .all()
      .find((subject) => subject.name === "Bio");

    // After the imported subjects, without the teacher that was replaced
    expect(bio).toEqual({
      id: 3,
      name: "Bio",
      abbreviation: "B",
      color: "#0000FF",
      teacherId: null,
    });
    expect(
      db
        .select()
        .from(lessons)
        .all()
        .some((lesson) => lesson.subjectId === 3)
    ).toBe(false);
    expect(db.select().from(grades).all()).toEqual([
      { id: 1, value: 5.5, weight: 2, date: "2026-11-02", note: null, subjectId: 3, entryId: 2 },
    ]);
    const exam = db
      .select()
      .from(entries)
      .all()
      .find((row) => row.title === "Prüfung");
    expect(exam?.subjectId).toBe(3);
  });

  test("an ungraded subject missing from the file is dropped, its entries become Allgemein", () => {
    const db = importClassmateTimetable();

    expect(
      db
        .select()
        .from(subjects)
        .all()
        .map((subject) => subject.name)
    ).toEqual(["Deutsch", "Mathe", "Bio"]);
    const report = db
      .select()
      .from(entries)
      .all()
      .find((row) => row.title === "Laborbericht");
    expect(report).toMatchObject({ subjectId: null, periodId: 2 });
  });
});

describe("savePeriods", () => {
  test("a period missing from the grid is deleted with its lessons, new ones are added", () => {
    const { db, savePeriods } = setup();
    seedBackup(db);

    savePeriods([
      { id: 1, startTime: "08:05", endTime: "08:50" },
      { id: null, startTime: "10:00", endTime: "10:45" },
    ]);

    expect(db.select().from(periods).all()).toEqual([
      { id: 1, startTime: "08:05", endTime: "08:50" },
      { id: 3, startTime: "10:00", endTime: "10:45" },
    ]);
    expect(
      db
        .select()
        .from(lessons)
        .all()
        .map((lesson) => lesson.periodId)
    ).toEqual([1]);
  });
});

describe("saveLessons", () => {
  test("replaces the whole timetable", () => {
    const { db, saveLessons } = setup();
    seedBackup(db);

    saveLessons([{ weekday: 5, periodId: 2, subjectId: 3, room: "Labor" }]);

    expect(
      db
        .select()
        .from(lessons)
        .all()
        .map(({ id: _id, ...slot }) => slot)
    ).toEqual([{ weekday: 5, periodId: 2, subjectId: 3, room: "Labor" }]);
  });
});

describe("resetDatabase", () => {
  test("leaves only a fresh settings row", () => {
    const { db, resetDatabase } = setup();
    seedBackup(db);

    resetDatabase();

    expect(contents(db)).toEqual({
      periods: [],
      teachers: [],
      subjects: [],
      lessons: [],
      semesters: [],
      entries: [],
      grades: [],
      settings: [
        {
          id: SETTINGS_ID,
          notificationsEnabled: true,
          secondReminderTime: "18:00",
          noLessonSummaryTime: "10:00",
        },
      ],
    });
  });
});

describe("parseTransferFile", () => {
  test("rejects a reference to a row missing from the file and names the row", () => {
    const { db, exportData } = setup();
    seedBackup(db);
    const file = exportData("backup");
    file.lessons[1] = { ...file.lessons[1], subjectId: 99 };

    const parse = () => parseTransferFile(JSON.stringify(file), TODAY);
    expect(parse).toThrow(TransferError);
    expect(parse).toThrow("Lektion 2: Das Fach mit der ID 99 fehlt in der Datei.");
  });

  // 0 stands for "no subject" (NONE) in the forms, so a row with it could not be chosen
  test("rejects an id below 1", () => {
    const { db, exportData } = setup();
    seedBackup(db);
    const file = exportData("backup");
    file.subjects[0] = { ...file.subjects[0], id: 0 };

    expect(() => parseTransferFile(JSON.stringify(file), TODAY)).toThrow(
      "Fach 1: Die ID 0 ist ungültig."
    );
  });
});
