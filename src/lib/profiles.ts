import { eq } from "drizzle-orm";

import type { AppDatabase } from "@/db/database";
import { profile } from "@/db/schema";

import type { ProfileValues } from "./profile-validation";
import type { EligibilityAnswer } from "./safety/eligibility";

/** A saved profile. Profiles from before the questions existed have no answers. */
export type SavedProfile = Omit<
  ProfileValues,
  "eatingDisorderAnswer" | "medicalConditionAnswer"
> & {
  eatingDisorderAnswer: EligibilityAnswer | null;
  medicalConditionAnswer: EligibilityAnswer | null;
};

/** Reads one account's profile. The account ID must come from the session. */
export function getProfile(
  db: AppDatabase,
  accountId: string,
): SavedProfile | null {
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
    eatingDisorderAnswer: readAnswer(row.eatingDisorderAnswer),
    medicalConditionAnswer: readAnswer(row.medicalConditionAnswer),
  };
}

/** Anything other than a stored yes or no counts as unanswered. */
function readAnswer(value: string | null): EligibilityAnswer | null {
  return value === "yes" || value === "no" ? value : null;
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
