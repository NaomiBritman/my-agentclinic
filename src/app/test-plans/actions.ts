"use server";

import { redirect } from "next/navigation";

import { getDatabase } from "@/db/database";
import { getAiProvider } from "@/lib/ai/gemini-provider";
import { generateMonthPlan, type GenerationResult } from "@/lib/ai/generate-plan";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { localDate } from "@/lib/dates";
import { getTestPlanAccess } from "@/lib/plan-access";
import { findTestProfile } from "@/lib/test-mode/test-profiles";
import {
  getActivePlan,
  removeActivePlan,
  saveActivePlan,
} from "@/lib/test-plans";
import { WORDING } from "@/lib/wording";

export type BuildFormState = { message: string | null };

// Stops a second build for the same account while one is running, which
// protects the free tier quota. The site runs as one local process.
const buildsRunning = new Set<string>();

/**
 * The safety limits message is only for real safety rule failures. Anything else
 * that stops a build, including a missing key or unusable output, is a problem
 * reaching a working answer from Gemini.
 */
function refusalMessage(result: GenerationResult | null): string {
  if (result && !result.ok) {
    if (result.reason === "limits") return WORDING.testPlans.noPlanProduced;
    if (result.reason === "busy") return WORDING.testPlans.geminiBusy;
  }
  return WORDING.testPlans.geminiUnreachable;
}

// The account comes from the session and the test profile from a built-in list.
// A saved profile is read only for the access rules, and is never passed on.
export async function buildPlanAction(
  _previous: BuildFormState,
  formData: FormData,
): Promise<BuildFormState> {
  const account = await requireAccountWithProfile();
  const db = getDatabase();

  const access = getTestPlanAccess(db, account.id);
  if (access.status === "answers-missing") redirect("/profile");
  if (access.status !== "available") return { message: null };

  const profile = findTestProfile(formData.get("testProfileKey"));
  if (!profile || access.hiddenGoals.includes(profile.goal)) {
    return { message: null };
  }

  if (getActivePlan(db, account.id)) redirect("/test-plans");
  if (buildsRunning.has(account.id)) return { message: null };

  buildsRunning.add(account.id);
  let result: GenerationResult | null;
  try {
    const provider = getAiProvider();
    result = provider ? await generateMonthPlan(profile.key, provider) : null;

    if (result?.ok) {
      saveActivePlan(db, account.id, result.plan, localDate());
    }
  } finally {
    buildsRunning.delete(account.id);
  }

  if (result?.ok) redirect("/test-plans");
  return { message: refusalMessage(result) };
}

export async function startOverAction(): Promise<void> {
  const account = await requireAccountWithProfile();
  const db = getDatabase();

  if (getTestPlanAccess(db, account.id).status === "available") {
    removeActivePlan(db, account.id);
  }
  redirect("/test-plans");
}
