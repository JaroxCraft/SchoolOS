import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

import { dataOperations } from "@/db/data";
import * as schema from "@/db/schema";

export const sqlite = openDatabaseSync("schoolos.db", { enableChangeListener: true });

export const db = drizzle(sqlite, { schema });

export const data = dataOperations(db);
