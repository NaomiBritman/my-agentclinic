import { EXERCISE_LIMITS, NUTRITION_LIMITS } from "../safety/limits";
import {
  checkExerciseMonth,
  checkMenuMonth,
} from "../safety/month-limits";
import type { ExerciseMonth, Menu } from "../safety/types";
import { catalogForLevel, EXERCISE_CATALOG } from "../test-mode/catalog";
import { findTestProfile, type TestProfile } from "../test-mode/test-profiles";

import {
  EXERCISE_MONTH_SCHEMA,
  MENU_SCHEMA,
  parseExerciseMonth,
  parseMenu,
} from "./plan-format";
import {
  MAX_RETRIES_PER_BUILD,
  REQUEST_TIMEOUT_MS,
  RETRY_WAIT_MS,
  type AiProvider,
} from "./provider";

export type GeneratedPlan = {
  testProfileKey: string;
  exercise: ExerciseMonth;
  menu: Menu;
};

export type RefusalReason =
  | "unknown-profile"
  | "busy"
  | "provider"
  | "format"
  | "limits";

export type GenerationResult =
  | { ok: true; plan: GeneratedPlan }
  | { ok: false; reason: RefusalReason };

/**
 * The only details about a person that may be sent. Everything comes from a
 * built-in made-up profile, which is why this code takes a key and never values.
 */
function detailsToSend(profile: TestProfile) {
  return {
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    fitnessLevel: profile.fitnessLevel,
    goal: profile.goal,
    allergies: profile.allergies,
    dietaryRestrictions: profile.dietaryRestrictions,
  };
}

function exercisePrompt(profile: TestProfile): string {
  const days = EXERCISE_LIMITS.strengthDaysPerWeek[profile.fitnessLevel];
  const { min, max } = EXERCISE_LIMITS.aerobicMinutesPerWeek;

  return [
    "Build a four-week exercise schedule for a made-up person, as a software demonstration. It isn't advice for anyone.",
    `Made-up person: ${JSON.stringify(detailsToSend(profile))}`,
    `Exercises you may use, and no others: ${JSON.stringify(catalogForLevel(profile.fitnessLevel))}`,
    "Follow every rule exactly. Code rejects the whole schedule if any rule is broken.",
    "- Return exactly 4 weeks. Number the days of each week from 1 to 7, and leave out days with nothing on them.",
    "- Use each exerciseKey exactly as listed. List aerobic exercises under aerobic, and the others under strength.",
    `- Every aerobic item has the intensity "${EXERCISE_LIMITS.intensity}".`,
    `- Each week's aerobic minutes add up to between ${min} and ${max}, in whole minutes.`,
    profile.fitnessLevel === "beginner"
      ? `- Week 1's aerobic minutes add up to exactly ${EXERCISE_LIMITS.beginnerFirstWeekAerobicMaxMinutes}.`
      : "",
    `- Each week has between ${days.min} and ${days.max} days with strength exercises.`,
    "- Week 1 uses each strength exercise's start amounts exactly. An exercise has the same amounts on every day of a week.",
    `- From each week to the next, total aerobic minutes stay the same or rise by at most ${EXERCISE_LIMITS.aerobicWeeklyIncrease * 100}%, rounded down.`,
    "- All four weeks use the same strength exercises with the same sets.",
    `- From each week to the next, a no-load exercise (loadKg null) keeps its repetitions or gains at most ${EXERCISE_LIMITS.noLoadExtraRepetitionsPerSet}.`,
    "- A loaded exercise keeps exactly the same repetitions and loadKg in all four weeks.",
  ]
    .filter(Boolean)
    .join("\n");
}

function menuPrompt(profile: TestProfile): string {
  return [
    "Build a seven-day menu for a made-up person, as a software demonstration. It isn't advice for anyone.",
    `Made-up person: ${JSON.stringify(detailsToSend(profile))}`,
    "Follow every rule exactly. Code rejects the whole menu if any rule is broken.",
    "- Return exactly 7 days, numbered from 1 to 7.",
    `- Each day's meal calories add up to at least ${NUTRITION_LIMITS.minDailyCalories}. Calories are your own estimates.`,
    "- Never use anything the person's allergies or dietary restrictions rule out, in any form.",
    "- Give each meal a short name, and each ingredient a short name and a portion in plain words.",
    profile.goal === "weight-loss"
      ? `- Set expectedWeeklyLossKg to your estimate of the weekly weight loss, which must be at most ${NUTRITION_LIMITS.maxWeeklyLossKg}.`
      : "- Set expectedWeeklyLossKg to null.",
  ].join("\n");
}

type Attempt =
  | { outcome: "reply"; text: string }
  | { outcome: "overloaded" | "timed-out" | "failed" };

/** Reads only the HTTP status of an error, which holds no request details. */
function httpStatusOf(error: unknown): unknown {
  return typeof error === "object" && error !== null && "status" in error
    ? error.status
    : undefined;
}

/** One attempt, stopped after the timeout. */
async function attemptOnce(
  provider: AiProvider,
  prompt: string,
  schema: object,
): Promise<Attempt> {
  const controller = new AbortController();
  let didTimeOut = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      didTimeOut = true;
      controller.abort();
      reject(new Error("timeout"));
    }, REQUEST_TIMEOUT_MS);
  });

  try {
    const text = await Promise.race([
      provider.generate({ prompt, schema, signal: controller.signal }),
      timeout,
    ]);
    return { outcome: "reply", text };
  } catch (error) {
    // Errors can hold request details, so they are never logged or passed on.
    if (didTimeOut) return { outcome: "timed-out" };
    const status = httpStatusOf(error);
    if (status === 503) return { outcome: "overloaded" };
    if (status === 504) return { outcome: "timed-out" };
    return { outcome: "failed" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One request. Only an overloaded provider is tried again, after a wait, and the
 * retries are shared across the whole build, so a build sends at most four
 * requests. A timeout is never retried, and neither is anything Gemini answered.
 */
async function requestJson(
  provider: AiProvider,
  prompt: string,
  schema: object,
  retries: { left: number },
): Promise<{ ok: true; value: unknown } | { ok: false; reason: RefusalReason }> {
  for (;;) {
    const attempt = await attemptOnce(provider, prompt, schema);

    if (attempt.outcome === "reply") {
      try {
        return { ok: true, value: JSON.parse(attempt.text) };
      } catch {
        return { ok: false, reason: "format" };
      }
    }
    if (attempt.outcome === "failed") return { ok: false, reason: "provider" };
    if (attempt.outcome === "timed-out" || retries.left === 0) {
      return { ok: false, reason: "busy" };
    }

    retries.left--;
    await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_MS));
  }
}

/**
 * Builds a month from a built-in test profile. This takes only a key, and the
 * code it uses can't reach saved profiles, so a saved profile can't be sent.
 * Only an overloaded provider is retried, and safety rule failures never are.
 * Any failure means that nothing is returned.
 */
export async function generateMonthPlan(
  testProfileKey: string,
  provider: AiProvider,
): Promise<GenerationResult> {
  const profile = findTestProfile(testProfileKey);
  if (!profile) return { ok: false, reason: "unknown-profile" };

  const retries = { left: MAX_RETRIES_PER_BUILD };

  const exerciseReply = await requestJson(
    provider,
    exercisePrompt(profile),
    EXERCISE_MONTH_SCHEMA,
    retries,
  );
  if (!exerciseReply.ok) return exerciseReply;

  const exercise = parseExerciseMonth(exerciseReply.value);
  if (!exercise) return { ok: false, reason: "format" };
  if (
    !checkExerciseMonth(exercise, {
      level: profile.fitnessLevel,
      catalog: EXERCISE_CATALOG,
    }).ok
  ) {
    return { ok: false, reason: "limits" };
  }

  const menuReply = await requestJson(
    provider,
    menuPrompt(profile),
    MENU_SCHEMA,
    retries,
  );
  if (!menuReply.ok) return menuReply;

  const menu = parseMenu(menuReply.value);
  if (!menu) return { ok: false, reason: "format" };
  if (!checkMenuMonth(menu, profile.goal, profile.wordsToAvoid).ok) {
    return { ok: false, reason: "limits" };
  }

  return { ok: true, plan: { testProfileKey, exercise, menu } };
}
