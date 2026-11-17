/// <reference types="bun" />
import { join } from "node:path";

import { Database as SQLite } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { prepareDatabase, type Database } from "@/db/database";
import * as schema from "@/db/schema";

export function createTestDatabase(): Database {
  const db = drizzle(new SQLite(":memory:"), { schema });
  migrate(db, { migrationsFolder: join(import.meta.dir, "../../drizzle") });
  prepareDatabase(db);
  return db;
}
