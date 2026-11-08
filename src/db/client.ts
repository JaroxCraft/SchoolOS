import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import * as schema from "@/db/schema";

// Foreign keys are turned on once the migrations have run (src/db/migrate.ts)
export const sqlite = openDatabaseSync("schoolos.db", { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });
