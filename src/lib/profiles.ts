import { eq } from "drizzle-orm";

import type { AppDatabase } from "@/db/database";
import { profile } from "@/db/schema";

import type { ProfileValues } from "./profile-validation";

/** Reads one account's profile. The account ID must come from the session. */
export function getProfile(
  db: AppDatabase,
  accountId: string,
): ProfileValues | null {
  const row = db
    .select()
    .from(profile)
    .where(eq(profile.userId, accountId))
    .get();
  if (!row) return null;

  return {
    age: row.age,
    heightCm: row.heightCm,
    weightKg: row.weightKg,
    fitnessLevel: row.fitnessLevel as ProfileValues["fitnessLevel"],
    goal: row.goal as ProfileValues["goal"],
  };
}

/** Saves one account's profile, replacing any old values. */
export function saveProfile(
  db: AppDatabase,
  accountId: string,
  values: ProfileValues,
): void {
  const row = { ...values, updatedAt: new Date() };

  db.insert(profile)
    .values({ userId: accountId, ...row })
    .onConflictDoUpdate({ target: profile.userId, set: row })
    .run();
}
