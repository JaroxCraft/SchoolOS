import { asc, eq } from "drizzle-orm";
import { getTableConfig, type SQLiteTable } from "drizzle-orm/sqlite-core";
import { addDatabaseChangeListener } from "expo-sqlite";
import { useSyncExternalStore } from "react";

import { db } from "@/db/client";
import {
  entries,
  lessons,
  periods,
  settings,
  SETTINGS_ID,
  subjects,
  teachers,
  type Settings,
} from "@/db/schema";

// The rows of one table, shared by every screen that shows it.
type TableStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
};

// Stores by table name, marked stale by the change listener below
const invalidators = new Map<string, () => void>();

// Reads the table synchronously on first use, so screens get their data right away and never show
// an empty state while loading (the database is opened synchronously). After a change it is read
// again only once someone asks for it, and only once for all screens that show it.
function tableStore<T>(table: SQLiteTable, read: () => T): TableStore<T> {
  const listeners = new Set<() => void>();
  let snapshot: T;
  let stale = true;

  invalidators.set(getTableConfig(table).name, () => {
    stale = true;
    listeners.forEach((listener) => listener());
  });

  return {
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => {
      if (stale) {
        snapshot = read();
        stale = false;
      }
      return snapshot;
    },
  };
}

// SQLite reports every changed row on its own, so saving a timetable or importing a backup sends
// dozens of events. They are collected and each changed table is read again once, after the
// events of this batch have arrived, instead of once per row and screen.
const changedTables = new Set<string>();
addDatabaseChangeListener(({ tableName }) => {
  if (!invalidators.has(tableName)) return;
  if (changedTables.size === 0) {
    setTimeout(() => {
      const tables = [...changedTables];
      changedTables.clear();
      tables.forEach((name) => invalidators.get(name)?.());
    }, 0);
  }
  changedTables.add(tableName);
});

function useTable<T>(store: TableStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

// Periods are sorted by start time, which periodNumber relies on
const periodsStore = tableStore(periods, () =>
  db.select().from(periods).orderBy(asc(periods.startTime)).all()
);
const subjectsStore = tableStore(subjects, () =>
  db.select().from(subjects).orderBy(asc(subjects.name)).all()
);
const teachersStore = tableStore(teachers, () =>
  db.select().from(teachers).orderBy(asc(teachers.name)).all()
);
const lessonsStore = tableStore(lessons, () => db.select().from(lessons).all());
const entriesStore = tableStore(entries, () =>
  db.select().from(entries).orderBy(asc(entries.date)).all()
);
// The row always exists: prepareDatabase creates it before the app renders, and a reset creates it
// again in the same transaction that deletes it.
const settingsStore = tableStore(settings, () =>
  db.select().from(settings).where(eq(settings.id, SETTINGS_ID)).get()!
);

export function usePeriods() {
  return useTable(periodsStore);
}

export function useSubjects() {
  return useTable(subjectsStore);
}

export function useTeachers() {
  return useTable(teachersStore);
}

export function useLessons() {
  return useTable(lessonsStore);
}

export function useEntries() {
  return useTable(entriesStore);
}

// The same entries outside of React, e.g. when a notification is tapped
export function getEntries() {
  return entriesStore.getSnapshot();
}

export function useSettings(): Settings {
  return useTable(settingsStore);
}
