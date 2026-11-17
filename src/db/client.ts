import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import { dataOperations } from "@/db/data";
import * as schema from "@/db/schema";

// The app's adapter of the database seam (src/db/database.ts). Foreign keys are turned on once
// the migrations have run (src/db/migrate.ts).
export const sqlite = openDatabaseSync("schoolos.db", { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

// The operations that replace whole tables, bound to the app's database
export const data = dataOperations(db);
