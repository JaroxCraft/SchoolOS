import { eq } from "drizzle-orm";

import { data, db } from "@/db/client";
import { entries, settings, subjects, teachers, type Settings } from "@/db/schema";

type NewTeacher = typeof teachers.$inferInsert;
type NewSubject = typeof subjects.$inferInsert;
type NewEntry = typeof entries.$inferInsert;

// The writes that replace whole tables (reset, period grid, timetable) live in src/db/data.ts
export const { resetDatabase, savePeriods, saveLessons } = data;

// Creates the settings row on the first launch. The period grid is left empty: schools differ,
// the setup asks for it first.
export async function initDatabase() {
  await db.insert(settings).values({ id: 1 }).onConflictDoNothing();
}

export async function updateSettings(values: Partial<Omit<Settings, "id">>) {
  await db.update(settings).set(values).where(eq(settings.id, 1));
}

// Returns the id of the new teacher
export async function addTeacher(values: NewTeacher): Promise<number> {
  const [added] = await db.insert(teachers).values(values).returning({ id: teachers.id });
  return added.id;
}

export async function updateTeacher(id: number, values: NewTeacher) {
  await db.update(teachers).set(values).where(eq(teachers.id, id));
}

export async function deleteTeacher(id: number) {
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
