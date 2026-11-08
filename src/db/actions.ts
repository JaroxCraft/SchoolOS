import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  DATA_TABLES,
  entries,
  lessons,
  periods,
  settings,
  subjects,
  teachers,
  type LessonSlot,
  type PeriodDraft,
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

// Saves the edited period grid all at once, all or nothing: periods missing from it are deleted
// with their lessons, periods without an id are added.
export function savePeriods(grid: PeriodDraft[]) {
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

// Replaces the whole timetable with the edited one, all or nothing. Nothing references a lesson,
// so new ids do no harm.
export function saveLessons(timetable: LessonSlot[]) {
  db.transaction((tx) => {
    tx.delete(lessons).run();
    if (timetable.length > 0) tx.insert(lessons).values(timetable).run();
  });
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
