import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { afterEach, beforeEach, expect, test } from "vitest";

import { openDatabase } from "./database";
import { profile, user } from "./schema";
import { createTestDatabase, type TestDatabase } from "./test-database";

let database: TestDatabase;

beforeEach(() => {
  database = createTestDatabase();
});

afterEach(() => {
  database.cleanup();
});

test("all migrations apply to an empty database", () => {
  expect(database.db.select().from(user).all()).toEqual([]);
});

test("upgrading an MVP database keeps profiles, with their answers left empty", () => {
  const folder = mkdtempSync(join(tmpdir(), "my-fit-plan-upgrade-"));
  const mvpMigrations = join(folder, "drizzle");
  cpSync("drizzle", mvpMigrations, { recursive: true });

  // Cuts the migrations back to the five that shipped with the MVP.
  const journalPath = join(mvpMigrations, "meta", "_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf8"));
  journal.entries = journal.entries.slice(0, 5);
  writeFileSync(journalPath, JSON.stringify(journal));

  const db = openDatabase(join(folder, "upgrade.db"));
  try {
    migrate(db, { migrationsFolder: mvpMigrations });

    const now = Date.now();
    db.$client
      .prepare(
        "INSERT INTO user (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      )
      .run("account-1", "Name", "a@example.com", 0, now, now);
    db.$client
      .prepare(
        "INSERT INTO profile (user_id, age, height_cm, weight_kg, fitness_level, goal, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run("account-1", 18, 1, 1, "beginner", "toning", now);

    migrate(db, { migrationsFolder: "drizzle" });

    expect(db.select().from(profile).all()).toMatchObject([
      {
        userId: "account-1",
        age: 18,
        goal: "toning",
        eatingDisorderAnswer: null,
        medicalConditionAnswer: null,
      },
    ]);
  } finally {
    db.$client.close();
    rmSync(folder, { recursive: true, force: true });
  }
});
