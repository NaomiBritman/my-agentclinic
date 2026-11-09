import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type { AppDatabase } from "@/db/database";
import { testPlan } from "@/db/schema";

import type { GeneratedPlan } from "./ai/generate-plan";
import { parseExerciseMonth, parseMenu } from "./ai/plan-format";
import { findTestProfile, type TestProfile } from "./test-mode/test-profiles";

export type ActivePlan = GeneratedPlan & {
  id: string;
  startDate: string;
  profile: TestProfile;
};

function readJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Reads one account's active plan. The account ID must come from the session.
 * A stored plan that can't be read again counts as no plan.
 */
export function getActivePlan(
  db: AppDatabase,
  accountId: string,
): ActivePlan | null {
  const row = db
    .select()
    .from(testPlan)
    .where(eq(testPlan.userId, accountId))
    .get();
  if (!row) return null;

  const profile = findTestProfile(row.testProfileKey);
  const exercise = parseExerciseMonth(readJson(row.exercise));
  const menu = readJson(row.menu);
  const parsedMenu = parseMenu(
    menu && typeof menu === "object"
      ? { expectedWeeklyLossKg: null, ...menu }
      : menu,
  );
  if (!profile || !exercise || !parsedMenu) return null;

  return {
    id: row.id,
    startDate: row.startDate,
    testProfileKey: row.testProfileKey,
    profile,
    exercise,
    menu: parsedMenu,
  };
}

/** Saves a checked plan as the account's active plan. */
export function saveActivePlan(
  db: AppDatabase,
  accountId: string,
  plan: GeneratedPlan,
  startDate: string,
): void {
  const row = {
    id: randomUUID(),
    testProfileKey: plan.testProfileKey,
    startDate,
    exercise: JSON.stringify(plan.exercise),
    menu: JSON.stringify(plan.menu),
    createdAt: new Date(),
  };

  db.insert(testPlan)
    .values({ userId: accountId, ...row })
    .onConflictDoUpdate({ target: testPlan.userId, set: row })
    .run();
}

/** Removes only this account's active plan. Past ticks stay in history. */
export function removeActivePlan(db: AppDatabase, accountId: string): void {
  db.delete(testPlan).where(eq(testPlan.userId, accountId)).run();
}
