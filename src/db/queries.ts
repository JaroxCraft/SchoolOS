import { asc, eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";

import { db } from "@/db/client";
import { entries, lessons, periods, settings, subjects, type Settings } from "@/db/schema";

const DEFAULT_SETTINGS: Settings = {
  id: 1,
  examLeadDays: 7,
  presentationLeadDays: 7,
  submissionLeadDays: 3,
  notificationsEnabled: true,
  secondReminderTime: "18:00",
  noLessonSummaryTime: "10:00",
};

export function usePeriods() {
  return useLiveQuery(db.select().from(periods).orderBy(asc(periods.startTime))).data;
}

export function useSubjects() {
  return useLiveQuery(db.select().from(subjects).orderBy(asc(subjects.name))).data;
}

export function useLessons() {
  return useLiveQuery(db.select().from(lessons)).data;
}

// Period grid and lessons together, with a flag once both have been read from the database.
export function useTimetable() {
  const periodsQuery = useLiveQuery(db.select().from(periods).orderBy(asc(periods.startTime)));
  const lessonsQuery = useLiveQuery(db.select().from(lessons));
  return {
    periods: periodsQuery.data,
    lessons: lessonsQuery.data,
    loaded: periodsQuery.updatedAt !== undefined && lessonsQuery.updatedAt !== undefined,
  };
}

export function useEntries() {
  return useLiveQuery(db.select().from(entries).orderBy(asc(entries.date))).data;
}

export function useSettings(): Settings {
  const { data } = useLiveQuery(db.select().from(settings).where(eq(settings.id, 1)));
  return data[0] ?? DEFAULT_SETTINGS;
}
