import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { ClockTime, IsoDate, Weekday } from "@/lib/dates";
import type { HexColor } from "@/lib/system-colors";

export const ENTRY_TYPES = ["homework", "exam", "presentation", "submission", "other"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const periods = sqliteTable("periods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startTime: text("start_time").notNull().$type<ClockTime>(),
  endTime: text("end_time").notNull().$type<ClockTime>(),
});

export const teachers = sqliteTable("teachers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  email: text("email"),
});

export const subjects = sqliteTable("subjects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  abbreviation: text("abbreviation").notNull(),
  color: text("color").notNull().$type<HexColor>(),
  teacherId: integer("teacher_id").references(() => teachers.id, { onDelete: "set null" }),
});

export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  weekday: integer("weekday").notNull().$type<Weekday>(),
  periodId: integer("period_id")
    .notNull()
    .references(() => periods.id, { onDelete: "cascade" }),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  room: text("room"),
});

export const semesters = sqliteTable("semesters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull().$type<IsoDate>(),
  endDate: text("end_date").notNull().$type<IsoDate>(),
});

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type", { enum: ENTRY_TYPES }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull().$type<IsoDate>(),
  periodId: integer("period_id").references(() => periods.id, { onDelete: "set null" }),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  completed: integer("completed", { mode: "boolean" }).notNull().default(false),
  topic: text("topic"),
});

export const grades = sqliteTable("grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  value: real("value").notNull(),
  weight: real("weight").notNull().default(1),
  date: text("date").notNull().$type<IsoDate>(),
  note: text("note"),
  subjectId: integer("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  entryId: integer("entry_id").references(() => entries.id, { onDelete: "set null" }),
});

// The id of the single settings row
export const SETTINGS_ID = 1;

// Single row with id SETTINGS_ID, created with the database (prepareDatabase in src/db/database.ts)
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  notificationsEnabled: integer("notifications_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  secondReminderTime: text("second_reminder_time").notNull().default("18:00").$type<ClockTime>(),
  noLessonSummaryTime: text("no_lesson_summary_time").notNull().default("10:00").$type<ClockTime>(),
});

export const DATA_TABLES = [grades, entries, lessons, subjects, teachers, periods, semesters];

// Every table: the data tables and the settings
export type Table = (typeof DATA_TABLES)[number] | typeof settings;

export type Period = typeof periods.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
// A lesson of the timetable while it is edited, saved together with the others
export type LessonDraft = Omit<Lesson, "id">;
// A period of the grid while it is edited; id null for a period added in the editor
export type PeriodDraft = Omit<Period, "id"> & { id: number | null };
export type Semester = typeof semesters.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type Settings = typeof settings.$inferSelect;
