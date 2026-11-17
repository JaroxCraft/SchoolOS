import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";

import migrations from "@/drizzle/migrations";
import { db } from "@/db/client";
import { enableForeignKeys } from "@/db/database";

async function runMigrations() {
  await migrate(db, migrations);
  enableForeignKeys(db);
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
