import { EXERCISE_LIMITS } from "./limits";
import {
  toCheckResult,
  type CatalogExercise,
  type CheckResult,
  type ExerciseWeek,
  type SafetyFitnessLevel,
  type StrengthItem,
} from "./types";

export type ExerciseCheckContext = {
  level: SafetyFitnessLevel;
  catalog: readonly CatalogExercise[];
};

// Allows for floating point rounding, such as 6 * 1.05, and nothing more.
const ROUNDING_TOLERANCE = 1e-9;

function isPositiveWhole(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function aerobicMinutes(week: ExerciseWeek): number {
  return week.days
    .flatMap((day) => day.aerobic)
    .reduce((total, item) => total + item.minutes, 0);
}

/** One entry per exercise. Weeks with differing amounts are already refused. */
function strengthByExercise(week: ExerciseWeek): Map<string, StrengthItem> {
  const items = new Map<string, StrengthItem>();
  for (const item of week.days.flatMap((day) => day.strength)) {
    if (!items.has(item.exerciseKey)) items.set(item.exerciseKey, item);
  }
  return items;
}

function sameAmounts(a: StrengthItem, b: StrengthItem): boolean {
  return (
    a.sets === b.sets &&
    a.repetitions === b.repetitions &&
    a.loadKg === b.loadKg
  );
}

/** The checks that apply to every week, first or later. */
function weekProblems(
  week: ExerciseWeek,
  { level, catalog }: ExerciseCheckContext,
): string[] {
  const problems: string[] = [];
  if (!Array.isArray(week.days) || week.days.length === 0) {
    return ["no-days"];
  }

  const available = new Map(
    catalog
      .filter((exercise) => exercise.levels.includes(level))
      .map((exercise) => [exercise.key, exercise]),
  );

  const dayNumbers = week.days.map((day) => day.day);
  if (dayNumbers.some((day) => !Number.isInteger(day) || day < 1 || day > 7)) {
    problems.push("invalid-day");
  }
  if (new Set(dayNumbers).size !== dayNumbers.length) {
    problems.push("repeated-day");
  }

  for (const item of week.days.flatMap((day) => day.aerobic)) {
    if (available.get(item.exerciseKey)?.type !== "aerobic") {
      problems.push("unknown-exercise");
    }
    if (!isPositiveWhole(item.minutes)) problems.push("invalid-minutes");
    if (item.intensity !== EXERCISE_LIMITS.intensity) {
      problems.push("intensity");
    }
  }

  const firstSeen = new Map<string, StrengthItem>();
  for (const item of week.days.flatMap((day) => day.strength)) {
    const exercise = available.get(item.exerciseKey);
    if (!exercise || exercise.type === "aerobic") {
      problems.push("unknown-exercise");
    } else if (exercise.type === "load" && !isPositiveNumber(item.loadKg)) {
      problems.push("invalid-load");
    } else if (exercise.type === "no-load" && item.loadKg !== null) {
      problems.push("invalid-load");
    }

    if (!isPositiveWhole(item.sets)) problems.push("invalid-sets");
    if (!isPositiveWhole(item.repetitions)) {
      problems.push("invalid-repetitions");
    }

    const earlier = firstSeen.get(item.exerciseKey);
    if (earlier && !sameAmounts(earlier, item)) {
      problems.push("differing-amounts");
    }
    if (!earlier) firstSeen.set(item.exerciseKey, item);
  }

  if (problems.length > 0) return problems;

  const minutes = aerobicMinutes(week);
  const { min, max } = EXERCISE_LIMITS.aerobicMinutesPerWeek;
  if (minutes < min) problems.push("aerobic-too-low");
  if (minutes > max) problems.push("aerobic-too-high");

  const strengthDays = week.days.filter((day) => day.strength.length > 0).length;
  const range = EXERCISE_LIMITS.strengthDaysPerWeek[level];
  if (strengthDays < range.min || strengthDays > range.max) {
    problems.push("strength-days");
  }

  return problems;
}

/** Checks a first week against the limits and the approved catalog amounts. */
export function checkFirstWeek(
  week: ExerciseWeek,
  context: ExerciseCheckContext,
): CheckResult {
  const problems = weekProblems(week, context);
  if (problems.length > 0) return toCheckResult(problems);

  if (
    context.level === "beginner" &&
    aerobicMinutes(week) > EXERCISE_LIMITS.beginnerFirstWeekAerobicMaxMinutes
  ) {
    problems.push("beginner-first-week-aerobic");
  }

  for (const [key, item] of strengthByExercise(week)) {
    const exercise = context.catalog.find((entry) => entry.key === key);
    if (
      !exercise ||
      exercise.type === "aerobic" ||
      !sameAmounts({ exerciseKey: key, ...exercise.start }, item)
    ) {
      problems.push("not-catalog-amount");
    }
  }

  return toCheckResult(problems);
}

/**
 * Checks a later week against the week before it. Sets, and the repetitions of
 * loaded exercises, have no approved increase, so they can't change.
 */
export function checkNextWeek(
  week: ExerciseWeek,
  previous: ExerciseWeek,
  context: ExerciseCheckContext & { markedLoadKeys: readonly string[] },
): CheckResult {
  const problems = weekProblems(week, context);
  if (problems.length > 0) return toCheckResult(problems);

  const minutes = aerobicMinutes(week);
  const previousMinutes = aerobicMinutes(previous);
  if (minutes < previousMinutes) problems.push("amount-fell");
  if (
    minutes >
    previousMinutes * (1 + EXERCISE_LIMITS.aerobicWeeklyIncrease) +
      ROUNDING_TOLERANCE
  ) {
    problems.push("aerobic-increase");
  }

  const current = strengthByExercise(week);
  const before = strengthByExercise(previous);
  if (
    current.size !== before.size ||
    [...current.keys()].some((key) => !before.has(key))
  ) {
    return toCheckResult([...problems, "changed-exercises"]);
  }

  for (const [key, item] of current) {
    const earlier = before.get(key) as StrengthItem;
    if (item.sets !== earlier.sets) problems.push("changed-sets");

    if (earlier.loadKg === null || item.loadKg === null) {
      const extra = item.repetitions - earlier.repetitions;
      if (extra < 0) problems.push("amount-fell");
      if (extra > EXERCISE_LIMITS.noLoadExtraRepetitionsPerSet) {
        problems.push("repetition-increase");
      }
      continue;
    }

    if (item.repetitions !== earlier.repetitions) {
      problems.push("changed-load-repetitions");
    }
    if (item.loadKg < earlier.loadKg) problems.push("amount-fell");

    const allowedLoad = context.markedLoadKeys.includes(key)
      ? earlier.loadKg * (1 + EXERCISE_LIMITS.loadWeeklyIncrease) +
        ROUNDING_TOLERANCE
      : earlier.loadKg;
    if (item.loadKg > allowedLoad) problems.push("load-increase");
  }

  return toCheckResult(problems);
}
