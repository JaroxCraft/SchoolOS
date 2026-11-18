import { sql } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

import { settings, SETTINGS_ID } from "@/db/schema";
import type * as schema from "@/db/schema";
import { t } from "@/i18n";

// The seam to the database: drizzle's synchronous SQLite flavour with the app's schema. The app
// opens it with expo-sqlite (src/db/client.ts), the tests with an in-memory bun:sqlite database
// (src/db/test-database.ts). Code that only needs this type runs on both, so it must not import
// expo modules.
export type Database = BaseSQLiteDatabase<"sync", unknown, typeof schema>;

// Foreign keys stay off while migrating, as SQLite requires for changing a table: a migration that
// rebuilds one (the only way to change a column or its foreign key) would otherwise delete the rows
// that reference it when it drops the old table. PRAGMA foreign_keys has no effect inside the
// migration transaction, so it is switched on after the migrations, once the references are
// checked.
function enableForeignKeys(db: Database) {
  const broken = db.all(sql`PRAGMA foreign_key_check;`);
  if (broken.length > 0) {
    throw new Error(t.common.database.brokenReferences(broken.length));
  }
  db.run(sql`PRAGMA foreign_keys = ON;`);
}

// Readies a migrated database: switches on the foreign keys and creates the settings row on the
// first launch, so every screen can read it. The period grid is left empty: schools differ, the
// setup asks for it first.
export function prepareDatabase(db: Database) {
  enableForeignKeys(db);
  db.insert(settings).values({ id: SETTINGS_ID }).onConflictDoNothing().run();
}
