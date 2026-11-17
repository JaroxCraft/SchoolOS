import { eq, getTableColumns } from "drizzle-orm";

import type { Database } from "@/db/database";
import {
  DATA_TABLES,
  entries,
  grades,
  lessons,
  periods,
  semesters,
  settings,
  SETTINGS_ID,
  subjects,
  teachers,
  type LessonSlot,
  type PeriodDraft,
  type Subject,
  type Table,
} from "@/db/schema";
import { TRANSFER_FORMAT, type TransferFile, type TransferKind } from "@/db/transfer";

// Rows per insert statement, so a large file stays below SQLite's limit of bound variables
const INSERT_CHUNK_SIZE = 500;

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

// The operations that replace whole tables at once: saving the period grid and the timetable,
// resetting, export and import. Each one is a single transaction, so it happens completely or not
// at all. Bound to a database once: the app binds them to its database in src/db/client.ts.
export function dataOperations(db: Database) {
  // Deletes all data, children before the rows they reference, and creates the settings row again
  // like on a new installation. One transaction: an interrupted reset leaves the data untouched.
  function resetDatabase() {
    db.transaction((tx) => {
      for (const table of [...DATA_TABLES, settings]) {
        tx.delete(table).run();
      }
      tx.insert(settings).values({ id: SETTINGS_ID }).run();
    });
  }

  // Saves the edited period grid all at once, all or nothing: periods missing from it are deleted
  // with their lessons, periods without an id are added.
  function savePeriods(grid: PeriodDraft[]) {
    db.transaction((tx) => {
      const kept = new Set(grid.map((period) => period.id));
      for (const { id } of tx.select({ id: periods.id }).from(periods).all()) {
        if (!kept.has(id)) tx.delete(periods).where(eq(periods.id, id)).run();
      }
      for (const { id, startTime, endTime } of grid) {
        if (id === null) {
          tx.insert(periods).values({ startTime, endTime }).run();
        } else {
          tx.update(periods).set({ startTime, endTime }).where(eq(periods.id, id)).run();
        }
      }
    });
  }

  // Replaces the whole timetable with the edited one, all or nothing. Nothing references a lesson,
  // so new ids do no harm.
  function saveLessons(timetable: LessonSlot[]) {
    db.transaction((tx) => {
      tx.delete(lessons).run();
      if (timetable.length > 0) tx.insert(lessons).values(timetable).run();
    });
  }

  function exportData(kind: TransferKind): TransferFile {
    const header = {
      app: "SchoolOS" as const,
      format: TRANSFER_FORMAT,
      exportedAt: new Date().toISOString(),
    };
    const allLessons = db.select().from(lessons).all();
    const allSubjects = db.select().from(subjects).all();
    const allTeachers = db.select().from(teachers).all();
    const allPeriods = db.select().from(periods).all();

    if (kind === "timetable") {
      // Classmates get the subjects of the timetable only, not the ones someone keeps for grades
      const usedSubjectIds = new Set(allLessons.map((lesson) => lesson.subjectId));
      const sharedSubjects = allSubjects.filter((subject) => usedSubjectIds.has(subject.id));
      const usedTeacherIds = new Set(sharedSubjects.map((subject) => subject.teacherId));
      return {
        ...header,
        kind,
        periods: allPeriods,
        teachers: allTeachers.filter((teacher) => usedTeacherIds.has(teacher.id)),
        subjects: sharedSubjects,
        lessons: allLessons,
      };
    }
    return {
      ...header,
      kind,
      periods: allPeriods,
      teachers: allTeachers,
      subjects: allSubjects,
      lessons: allLessons,
      entries: db.select().from(entries).all(),
      grades: db.select().from(grades).all(),
      semesters: db.select().from(semesters).all(),
      settings: db.select().from(settings).all()[0],
    };
  }

  // Replaces the data with the content of a file checked by parseTransferFile, in one
  // transaction, so a failing import leaves everything as it was. A timetable file keeps entries,
  // grades and semesters: entries and grades move to the imported subject and period with the
  // same name and start time. Old subjects that are not in the file but still have grades stay
  // (without lessons), so no grade is lost; other entries lose their subject or period
  // ("Allgemein").
  function importData(file: TransferFile) {
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
      const importedSubjectIds = new Map(
        file.subjects.map((subject) => [subject.name, subject.id])
      );
      const importedPeriodIds = new Map(
        file.periods.map((period) => [period.startTime, period.id])
      );

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

  return { resetDatabase, savePeriods, saveLessons, exportData, importData };
}
