import { asc, eq } from "drizzle-orm";
import { getTableConfig, type SQLiteTable } from "drizzle-orm/sqlite-core";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useEffect, useState } from "react";

import { db } from "@/db/client";
import {
  entries,
  lessons,
  periods,
  settings,
  subjects,
  teachers,
  type Settings,
} from "@/db/schema";

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  examLeadDays: 7,
  presentationLeadDays: 7,
  submissionLeadDays: 3,
  notificationsEnabled: true,
  secondReminderTime: "18:00",
  noLessonSummaryTime: "10:00",
};

// Reads the table synchronously on the first render and again whenever it changes. The database
// is opened synchronously, so screens get their data right away and never show an empty state
// while loading.
function useTable<T>(table: SQLiteTable, read: () => T): T {
  const [data, setData] = useState(read);

  useEffect(() => {
    const { name } = getTableConfig(table);
    const listener = addDatabaseChangeListener(({ tableName }) => {
      if (tableName === name) setData(read());
    });
    return () => listener.remove();
  }, [table, read]);

  return data;
}

// Periods are sorted by start time, which periodNumber relies on
const readPeriods = () => db.select().from(periods).orderBy(asc(periods.startTime)).all();
const readSubjects = () => db.select().from(subjects).orderBy(asc(subjects.name)).all();
const readTeachers = () => db.select().from(teachers).orderBy(asc(teachers.name)).all();
const readLessons = () => db.select().from(lessons).all();
const readEntries = () => db.select().from(entries).orderBy(asc(entries.date)).all();
const readSettings = () =>
  db.select().from(settings).where(eq(settings.id, 1)).get() ?? DEFAULT_SETTINGS;

export function usePeriods() {
  return useTable(periods, readPeriods);
}

export function useSubjects() {
  return useTable(subjects, readSubjects);
}

export function useTeachers() {
  return useTable(teachers, readTeachers);
}

export function useLessons() {
  return useTable(lessons, readLessons);
}

export function useEntries() {
  return useTable(entries, readEntries);
}

export function useSettings(): Settings {
  return useTable(settings, readSettings);
}
