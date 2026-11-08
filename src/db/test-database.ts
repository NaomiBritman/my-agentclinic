import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";

import { openDatabase, type AppDatabase } from "./database";

export type TestDatabase = {
  db: AppDatabase;
  cleanup: () => void;
};

/** Opens a migrated database in a temporary folder, never the real file. */
export function createTestDatabase(): TestDatabase {
  const folder = mkdtempSync(join(tmpdir(), "my-fit-plan-test-"));
  const db = openDatabase(join(folder, "test.db"));
  migrate(db, { migrationsFolder: "drizzle" });

  return {
    db,
    cleanup: () => {
      db.$client.close();
      rmSync(folder, { recursive: true, force: true });
    },
  };
}
