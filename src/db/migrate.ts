import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";

import migrations from "@/drizzle/migrations";
import { db, sqlite } from "@/db/client";

// Foreign keys stay off while migrating, as SQLite requires for changing a table: a migration that
// rebuilds one (the only way to change a column or its foreign key) would otherwise delete the rows
// that reference it when it drops the old table. PRAGMA foreign_keys has no effect inside the
// migration transaction, so it is switched around it. The references are checked afterwards.
async function runMigrations() {
  await migrate(db, migrations);
  const broken = sqlite.getAllSync("PRAGMA foreign_key_check;");
  if (broken.length > 0) {
    throw new Error(`${broken.length} Verweise in der Datenbank zeigen ins Leere.`);
  }
  sqlite.execSync("PRAGMA foreign_keys = ON;");
}

export function useDatabaseMigrations() {
  const [state, setState] = useState<{ success: boolean; error?: Error }>({ success: false });

  useEffect(() => {
    runMigrations().then(
      () => setState({ success: true }),
      (error: Error) => setState({ success: false, error })
    );
  }, []);

  return state;
}
