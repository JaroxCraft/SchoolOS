import { db } from "./client";
import { lessons, periods, subjects } from "./schema";

// Test data for development: the S3a timetable 2026/27 of the Oberstufe Uznach.

const PERIODS = [
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

const SUBJECTS = [
  { abbreviation: "D", name: "Deutsch", teacher: "Julian Riegger", color: "#007AFF" },
  { abbreviation: "M", name: "Mathematik", teacher: "Gregor Urban", color: "#FF3B30" },
  { abbreviation: "F", name: "Französisch", teacher: "Renate Landis", color: "#FFCC00" },
  { abbreviation: "E", name: "Englisch", teacher: "Julian Riegger", color: "#AF52DE" },
  { abbreviation: "Ef", name: "Englisch B2 First", teacher: "Julian Riegger", color: "#AF52DE" },
  {
    abbreviation: "RZG",
    name: "Räume, Zeiten, Gesellschaften",
    teacher: "Julian Riegger",
    color: "#FF2D55",
  },
  { abbreviation: "N+T", name: "Natur und Technik", teacher: "Werner Coretti", color: "#34C759" },
  {
    abbreviation: "IS",
    name: "Medien und Informatik",
    teacher: "Simon Schiesser",
    color: "#00C7BE",
  },
  { abbreviation: "Mu", name: "Musik", teacher: "Beda Müller", color: "#FF9500" },
  { abbreviation: "Band", name: "Band", teacher: "Beda Müller", color: "#FF9500" },
  { abbreviation: "SpK", name: "Sport", teacher: "Simon Schiesser", color: "#A2845E" },
  { abbreviation: "S", name: "Bewegung und Sport", teacher: "Gina Wespe", color: "#A2845E" },
  { abbreviation: "WAH", name: "WAH", teacher: "Julian Riegger", color: "#5856D6" },
  {
    abbreviation: "ERG",
    name: "Ethik, Religionen, Gemeinschaft",
    teacher: "Julian Riegger",
    color: "#5856D6",
  },
  {
    abbreviation: "BO",
    name: "Berufliche Orientierung",
    teacher: "Julian Riegger",
    color: "#5856D6",
  },
  { abbreviation: "P", name: "Projektarbeit", teacher: "Valentin Bucher-Good", color: "#00C7BE" },
];

// [weekday, period number, subject abbreviation, room]
const LESSONS: [number, number, string, string][] = [
  [1, 1, "D", "120"],
  [1, 2, "D", "120"],
  [1, 3, "RZG", "120"],
  [1, 4, "RZG", "120"],
  [1, 5, "F", "117"],
  [1, 7, "P", "317"],
  [1, 8, "WAH", "120"],
  [1, 9, "WAH", "120"],
  [1, 10, "ERG", "120"],
  [2, 1, "Mu", "324"],
  [2, 2, "M", "118"],
  [2, 3, "SpK", "H1"],
  [2, 4, "SpK", "H1"],
  [2, 7, "Band", "324"],
  [2, 8, "N+T", "323"],
  [3, 1, "F", "117"],
  [3, 2, "RZG", "120"],
  [3, 3, "S", "H1"],
  [3, 4, "M", "118"],
  [3, 5, "M", "118"],
  [4, 1, "E", "120"],
  [4, 2, "E", "120"],
  [4, 3, "D", "120"],
  [4, 4, "D", "120"],
  [4, 5, "BO", "120"],
  [4, 7, "Ef", "120"],
  [5, 1, "N+T", "323"],
  [5, 2, "N+T", "323"],
  [5, 5, "IS", "412"],
  [5, 6, "M", "118"],
  [5, 7, "M", "118"],
];

// Fills an empty database with the test timetable. Does nothing once data exists.
export async function seedDevData() {
  const existing = await db.select({ id: periods.id }).from(periods).limit(1);
  if (existing.length > 0) return;

  const periodIds = await db
    .insert(periods)
    .values(PERIODS.map(([startTime, endTime]) => ({ startTime, endTime })))
    .returning({ id: periods.id });
  const subjectRows = await db
    .insert(subjects)
    .values(SUBJECTS)
    .returning({ id: subjects.id, abbreviation: subjects.abbreviation });

  const subjectId = (abbreviation: string) =>
    subjectRows.find((row) => row.abbreviation === abbreviation)!.id;

  await db.insert(lessons).values(
    LESSONS.map(([weekday, period, abbreviation, room]) => ({
      weekday,
      periodId: periodIds[period - 1].id,
      subjectId: subjectId(abbreviation),
      room,
    }))
  );
}
