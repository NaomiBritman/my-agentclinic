import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import BetterSqlite3 from "better-sqlite3";
import {
  drizzle,
  type BetterSQLite3Database,
} from "drizzle-orm/better-sqlite3";

import * as schema from "./schema";

export const DATABASE_PATH = "data/my-fit-plan.db";

export type AppDatabase = BetterSQLite3Database<typeof schema> & {
  $client: BetterSqlite3.Database;
};

export function openDatabase(path: string): AppDatabase {
  mkdirSync(dirname(path), { recursive: true });

  const client = new BetterSqlite3(path);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");

  return drizzle(client, { schema });
}

// Next.js reloads modules during development, so the open connection is kept
// on globalThis to avoid opening a new one on every reload.
const globalForDatabase = globalThis as unknown as {
  appDatabase?: AppDatabase;
};

export function getDatabase(): AppDatabase {
  globalForDatabase.appDatabase ??= openDatabase(DATABASE_PATH);
  return globalForDatabase.appDatabase;
}
