import { afterEach, beforeEach, expect, test } from "vitest";

import { user } from "./schema";
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
