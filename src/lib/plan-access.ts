import type { AppDatabase } from "@/db/database";

import { getProfile, type SavedProfile } from "./profiles";
import {
  getPlanAccess,
  isWeightLossRefusedByBmi,
  type PlanAccess,
} from "./safety/eligibility";
import { WORDING } from "./wording";

export type TestPlanAccess = PlanAccess | { status: "no-profile" };

/**
 * Whether test plans are available to one account. The account ID must come
 * from the session. This reads saved details only to apply the access rules,
 * and is kept apart from anything that talks to the AI provider.
 */
export function getTestPlanAccess(
  db: AppDatabase,
  accountId: string,
): TestPlanAccess {
  const profile = getProfile(db, accountId);
  return profile ? getPlanAccess(profile) : { status: "no-profile" };
}

type MessageDetails = Pick<
  SavedProfile,
  | "goal"
  | "heightCm"
  | "weightKg"
  | "eatingDisorderAnswer"
  | "medicalConditionAnswer"
>;

/** The approved message that applies to a saved profile, if any. */
export function getEligibilityMessage(details: MessageDetails): string | null {
  if (getPlanAccess(details).status === "no-plan") {
    return WORDING.eligibility.noPlan;
  }
  if (
    details.goal === "weight-loss" &&
    isWeightLossRefusedByBmi(details.heightCm, details.weightKg)
  ) {
    return WORDING.eligibility.noWeightLossPlan;
  }
  return null;
}
