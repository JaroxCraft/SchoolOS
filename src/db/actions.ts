import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  entries,
  grades,
  lessons,
  periods,
  semesters,
  settings,
  subjects,
  teachers,
  type Settings,
} from "@/db/schema";

type NewTeacher = typeof teachers.$inferInsert;
type NewSubject = typeof subjects.$inferInsert;
type NewEntry = typeof entries.$inferInsert;

// Deletes all data, children before the rows they reference.
export async function clearDatabase() {
  for (const table of [
    grades,
    entries,
    lessons,
    subjects,
    teachers,
    periods,
    semesters,
    settings,
  ]) {
    await db.delete(table);
  }
}

// Period grid of the Oberstufe Uznach, the starting point of every new installation
const DEFAULT_PERIODS = [
  ["07:25", "08:15"],
  ["08:15", "09:05"],
  ["09:05", "09:55"],
  ["10:15", "11:05"],
  ["11:05", "11:55"],
  ["11:55", "12:45"],
  ["12:45", "13:35"],
  ["13:40", "14:30"],
  ["14:30", "15:20"],
  ["15:35", "16:25"],
  ["16:25", "17:15"],
] as const;

// Creates the settings row on the first launch (or after clearing the database)
// and fills in the default period grid along with it.
export async function initDatabase() {
  const created = await db
    .insert(settings)
    .values({ id: 1 })
    .onConflictDoNothing()
    .returning({ id: settings.id });
  if (created.length === 0) return;

  await db
    .insert(periods)
    .values(DEFAULT_PERIODS.map(([startTime, endTime]) => ({ startTime, endTime })));
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

export async function deletePeriod(id: number) {
  await db.delete(periods).where(eq(periods.id, id));
}

export async function saveTeacher(id: number | null, values: NewTeacher) {
  if (id === null) {
    await db.insert(teachers).values(values);
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
  await db.delete(lessons).where(and(eq(lessons.weekday, weekday), eq(lessons.periodId, periodId)));
  if (subjectId !== null) {
    await db.insert(lessons).values({ weekday, periodId, subjectId, room });
  }
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
