/// <reference types="bun" />
import { join } from "node:path";

import { Database as SQLite } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

import { prepareDatabase, type Database } from "@/db/database";
import * as schema from "@/db/schema";

// The test adapter of the database seam: a fresh in-memory database with the app's migrations,
// foreign keys and settings row, set up like the app's database (src/db/migrate.ts). The app
// bundles the migrations into its code; here they are read from the drizzle folder.
export function createTestDatabase(): Database {
  const db = drizzle(new SQLite(":memory:"), { schema });
  migrate(db, { migrationsFolder: join(import.meta.dir, "../../drizzle") });
  prepareDatabase(db);
  return db;
}
