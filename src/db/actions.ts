import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  DATA_TABLES,
  entries,
  lessons,
  periods,
  settings,
  subjects,
  teachers,
  type Settings,
} from "@/db/schema";

type NewTeacher = typeof teachers.$inferInsert;
type NewSubject = typeof subjects.$inferInsert;
type NewEntry = typeof entries.$inferInsert;

// Deletes all data, children before the rows they reference, and creates the settings row again
// like on a new installation. One transaction: an interrupted reset leaves the data untouched.
export function resetDatabase() {
  db.transaction((tx) => {
    for (const table of [...DATA_TABLES, settings]) {
      tx.delete(table).run();
    }
    tx.insert(settings).values({ id: 1 }).run();
  });
}

// Creates the settings row on the first launch. The period grid is left empty: schools differ,
// the setup asks for it first.
export async function initDatabase() {
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
}

export async function updateSettings(values: Partial<Omit<Settings, "id">>) {
  await db.update(settings).set(values).where(eq(settings.id, 1));
}

export async function addPeriod(startTime: string, endTime: string) {
  await db.insert(periods).values({ startTime, endTime });
}

export async function updatePeriod(id: number, startTime: string, endTime: string) {
  await db.update(periods).set({ startTime, endTime }).where(eq(periods.id, id));
}

// Saves several edited periods at once, all or nothing.
export async function updatePeriods(changes: { id: number; startTime: string; endTime: string }[]) {
  db.transaction((tx) => {
    for (const { id, startTime, endTime } of changes) {
      tx.update(periods).set({ startTime, endTime }).where(eq(periods.id, id)).run();
    }
  });
}

export async function deletePeriod(id: number) {
  await db.delete(periods).where(eq(periods.id, id));
}

// Returns the id of the new teacher
export async function addTeacher(values: NewTeacher): Promise<number> {
  const [added] = await db.insert(teachers).values(values).returning({ id: teachers.id });
  return added.id;
}

export async function saveTeacher(id: number | null, values: NewTeacher) {
  if (id === null) {
    await addTeacher(values);
  } else {
    await db.update(teachers).set(values).where(eq(teachers.id, id));
  }
}

// Subjects of the teacher keep existing without a teacher. Cleared by hand: the column was added
// in a migration (ALTER TABLE), so the database lacks the "on delete set null" of the schema.
export async function deleteTeacher(id: number) {
  await db.update(subjects).set({ teacherId: null }).where(eq(subjects.teacherId, id));
  await db.delete(teachers).where(eq(teachers.id, id));
}

export async function saveSubject(id: number | null, values: NewSubject) {
  if (id === null) {
    await db.insert(subjects).values(values);
  } else {
    await db.update(subjects).set(values).where(eq(subjects.id, id));
  }
}

// Lessons and grades are removed with the subject, entries become "Allgemein".
export async function deleteSubject(id: number) {
  await db.delete(subjects).where(eq(subjects.id, id));
}

// Sets the lesson for a weekday and period; subjectId null makes the slot free.
export async function setLesson(
  weekday: number,
  periodId: number,
  subjectId: number | null,
  room: string | null
) {
  db.transaction((tx) => {
    tx.delete(lessons)
      .where(and(eq(lessons.weekday, weekday), eq(lessons.periodId, periodId)))
      .run();
    if (subjectId !== null) {
      tx.insert(lessons).values({ weekday, periodId, subjectId, room }).run();
    }
  });
}

export async function setLessonRoom(id: number, room: string | null) {
  await db.update(lessons).set({ room }).where(eq(lessons.id, id));
}

export async function saveEntry(id: number | null, values: NewEntry) {
  if (id === null) {
    await db.insert(entries).values(values);
  } else {
    await db.update(entries).set(values).where(eq(entries.id, id));
  }
}

export async function setEntryCompleted(id: number, completed: boolean) {
  await db.update(entries).set({ completed }).where(eq(entries.id, id));
}

export async function deleteEntry(id: number) {
  await db.delete(entries).where(eq(entries.id, id));
}
