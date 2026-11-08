import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { defineConfig } from "drizzle-kit";

const DATABASE_PATH = "data/my-fit-plan.db";

mkdirSync(dirname(DATABASE_PATH), { recursive: true });

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: DATABASE_PATH },
});
