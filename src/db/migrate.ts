import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { useEffect, useState } from "react";

import { db } from "@/db/client";
import { prepareDatabase } from "@/db/database";
import migrations from "@/drizzle/migrations";

async function runMigrations() {
  await migrate(db, migrations);
  prepareDatabase(db);
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
