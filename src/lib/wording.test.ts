import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

import { PLAN_UNITS } from "./plan-units";
import { SAMPLE_EXERCISES, SAMPLE_MEALS } from "./samples";
import { MEDICAL_NOTICE, MISSION_SENTENCE, SITE_NAME } from "./site";
import { WORDING } from "./wording";

function collectText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    return Object.values(value).flatMap(collectText);
  }
  return [];
}

const ALL_TEXT = [
  SITE_NAME,
  MISSION_SENTENCE,
  MEDICAL_NOTICE,
  ...collectText(WORDING),
  ...SAMPLE_EXERCISES.map((item) => item.name),
  ...SAMPLE_MEALS.map((item) => item.name),
];

const wholeWords = (...words: string[]) =>
  new RegExp(`\\b(${words.join("|")})(s|es)?\\b`, "i");

const CHECKS = {
  healthMeasures: wholeWords(
    "calorie",
    "kcal",
    "bmi",
    "protein",
    "carb",
    "fat",
    "rep",
    "set",
    "minute",
  ),
  rewardsAndPressure: wholeWords(
    "streak",
    "score",
    "scored",
    "reward",
    "badge",
    "point",
    "goal reached",
    "keep it up",
    "don't break",
    "push harder",
  ),
  targets: wholeWords("target", "budget", "allowance", "minimum"),
  judgments: wholeWords(
    "well done",
    "great job",
    "good",
    "bad",
    "failed",
    "missed",
    "cheat",
    "guilt",
    "too much",
    "too little",
    "only ate",
  ),
};

/** Digits are refused, other than the mission's age in the under-18 message. */
function hasRefusedNumber(text: string): boolean {
  const allowed = text === WORDING.profile.underAge ? text.replace("18", "") : text;
  return /\d/.test(allowed);
}

function problemsIn(rawText: string): string[] {
  // "A minute or two" describes waiting for the page, not a health measure.
  const text =
    rawText === WORDING.testPlans.loading
      ? rawText.replace("a minute or two", "a while")
      : rawText;
  const problems = Object.entries(CHECKS)
    .filter(([, pattern]) => pattern.test(text))
    .map(([name]) => name);
  return hasRefusedNumber(text) ? [...problems, "numbers"] : problems;
}

describe("the wording test catches planted examples", () => {
  test.each([
    ["Item 7 today", "numbers"],
    ["You're at 18 now", "numbers"],
    ["Fewer calories today", "healthMeasures"],
    ["Add more protein", "healthMeasures"],
    ["Do three sets", "healthMeasures"],
    ["Rest a minute", "healthMeasures"],
    ["Your daily target", "targets"],
    ["Your calorie budget", "targets"],
    ["Today's allowance", "targets"],
    ["The daily minimum", "targets"],
    ["A seven day streak!", "rewardsAndPressure"],
    ["Your score today", "rewardsAndPressure"],
    ["Keep it up", "rewardsAndPressure"],
    ["Don't break your run", "rewardsAndPressure"],
    ["Well done!", "judgments"],
    ["A good day", "judgments"],
    ["You missed lunch", "judgments"],
    ["That's too much", "judgments"],
    ["You only ate once", "judgments"],
  ])("%j is flagged as %s", (text, problem) => {
    expect(problemsIn(text)).toContain(problem);
  });

  test("whole words are matched, so similar words are allowed", () => {
    expect(problemsIn("Asset Goodwin Badger Fatigue Reptile")).toEqual([]);
  });
});

test("health measure words appear only in the named list of unit labels", () => {
  expect(Object.keys(PLAN_UNITS)).toEqual([
    "aerobicMinutes",
    "strengthDays",
    "heightCm",
    "weightKg",
  ]);
  for (const unit of Object.values(PLAN_UNITS)) expect(unit).not.toMatch(/\d/);
});

test("the home page uses the approved sentence", () => {
  expect(MISSION_SENTENCE).toBe(
    "Your month of movement and meals, one day at a time.",
  );
});

test("the site text was collected", () => {
  expect(ALL_TEXT.length).toBeGreaterThan(50);
  expect(ALL_TEXT).toContain(WORDING.today.noteHelp);
  expect(ALL_TEXT).toContain("Wall push-ups");
  expect(ALL_TEXT).toContain(MEDICAL_NOTICE);
});

test.each([
  WORDING.eligibility.eatingDisorderQuestion,
  WORDING.eligibility.medicalConditionQuestion,
  WORDING.eligibility.noPlan,
  WORDING.eligibility.noWeightLossPlan,
  WORDING.testPlans.testModeNotice,
  WORDING.testPlans.demonstrationNotice,
  WORDING.testPlans.geminiBusy,
  WORDING.testPlans.geminiUnreachable,
])("%j matches the approved text exactly", (text) => {
  expect(readFileSync("specs/safety-limits.md", "utf8")).toContain(text);
});

test.each(ALL_TEXT)("%j has no numbers, pressure or judgments", (text) => {
  expect(problemsIn(text)).toEqual([]);
});
