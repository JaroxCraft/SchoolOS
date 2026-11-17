/// <reference types="bun" />

import { readFileSync } from "node:fs";

import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";

import { ENTRY_TYPES, type Entry, type EntryType } from "@/db/schema";
import { completePastEvents, isOverdue, placeEntries } from "@/lib/entry-status";

let nextId = 1;
function entry(date: string, completed = false, type: EntryType = "homework"): Entry {
  return {
    id: nextId++,
    type,
    title: `${type} ${date}`,
    description: null,
    subjectId: null,
    date,
    periodId: null,
    completed,
    topic: null,
  };
}

describe("placeEntries", () => {
  test("splits by completion, done ones most recent first", () => {
    const missed = entry("2026-11-10", false, "exam");
    const early = entry("2026-11-11", true);
    const late = entry("2026-11-12", true, "presentation");
    const next = entry("2026-11-20");
    const { open, done } = placeEntries([missed, early, late, next]);
    expect(open).toEqual([missed, next]);
    expect(done).toEqual([late, early]);
  });

  test("an entry toggled just now stays where it was until it is released", () => {
    const checkedOff = { ...entry("2026-11-18"), completed: true };
    const reopened = entry("2026-11-19");
    const placedBefore = new Map([
      [checkedOff.id, false],
      [reopened.id, true],
    ]);
    const { open, done } = placeEntries([checkedOff, reopened], placedBefore);
    expect(open).toEqual([checkedOff]);
    expect(done).toEqual([reopened]);
  });
});

test("an open entry is overdue once its date has passed, a done one never", () => {
  expect(isOverdue(entry("2026-11-16"), "2026-11-17")).toBe(true);
  expect(isOverdue(entry("2026-11-17"), "2026-11-17")).toBe(false);
  expect(isOverdue(entry("2026-11-16", true), "2026-11-17")).toBe(false);
});

test("completePastEvents matches migration 0005", () => {
  const today = new Date().toLocaleDateString("sv-SE");
  const rows = ENTRY_TYPES.flatMap((type) => [
    entry("2000-01-01", false, type),
    entry(today, false, type),
    entry("2999-01-01", false, type),
  ]);

  const sqlite = new Database(":memory:");
  sqlite.run("CREATE TABLE entries (id INTEGER, type TEXT, date TEXT, completed INTEGER)");
  const insert = sqlite.prepare("INSERT INTO entries VALUES (?, ?, ?, 0)");
  for (const row of rows) insert.run(row.id, row.type, row.date);
  sqlite.run(readFileSync("drizzle/0005_complete_past_events.sql", "utf8"));
  const migrated = sqlite
    .query<{ id: number }, []>("SELECT id FROM entries WHERE completed = 1 ORDER BY id")
    .all()
    .map((row) => row.id);

  const imported = completePastEvents(rows, today)
    .filter((row) => row.completed)
    .map((row) => row.id);
  expect(imported).toEqual(migrated);
  expect(imported.length).toBe(3);
});
