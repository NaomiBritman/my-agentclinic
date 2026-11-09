import {
  checkFirstWeek,
  checkNextWeek,
  type ExerciseCheckContext,
} from "./exercise-limits";
import { checkMenuLimits } from "./nutrition-limits";
import {
  toCheckResult,
  type CheckResult,
  type ExerciseMonth,
  type Menu,
  type SafetyGoal,
} from "./types";

export const WEEKS_IN_MONTH = 4;
export const DAYS_IN_MENU = 7;

function problemsOf(result: CheckResult): string[] {
  return result.ok ? [] : result.problems;
}

/**
 * Checks all four weeks of a generated plan. No exercise counts as marked, so
 * any load rise is refused: loads only rise later, after a person marks them.
 */
export function checkExerciseMonth(
  month: ExerciseMonth,
  context: ExerciseCheckContext,
): CheckResult {
  if (!Array.isArray(month.weeks) || month.weeks.length !== WEEKS_IN_MONTH) {
    return toCheckResult(["wrong-week-count"]);
  }

  const problems = month.weeks.flatMap((week, index) =>
    (index === 0
      ? problemsOf(checkFirstWeek(week, context))
      : problemsOf(
          checkNextWeek(week, month.weeks[index - 1], {
            ...context,
            markedLoadKeys: [],
          }),
        )
    ).map((problem) => `week-${index + 1}:${problem}`),
  );

  return toCheckResult(problems);
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

/**
 * A plain word match, which can't prove that a menu is safe. It deliberately
 * matches inside longer words, so that "shellfish" is caught by "fish", and it
 * can refuse an innocent word. A refusal only means building again.
 */
export function findWordsToAvoid(
  menu: Menu,
  wordsToAvoid: readonly string[],
): string[] {
  const names = menu.days
    .flatMap((day) => day.meals)
    .flatMap((meal) => [
      meal.name,
      ...meal.ingredients.map((ingredient) => ingredient.name),
    ])
    .map(normalize);

  return wordsToAvoid.filter((word) =>
    names.some((name) => name.includes(normalize(word))),
  );
}

/** Checks a whole seven-day menu, which repeats each week. */
export function checkMenuMonth(
  menu: Menu,
  goal: SafetyGoal,
  wordsToAvoid: readonly string[],
): CheckResult {
  if (!Array.isArray(menu.days) || menu.days.length !== DAYS_IN_MENU) {
    return toCheckResult(["wrong-day-count"]);
  }

  const dayNumbers = menu.days.map((day) => day.day).sort((a, b) => a - b);
  if (dayNumbers.some((day, index) => day !== index + 1)) {
    return toCheckResult(["wrong-day-numbers"]);
  }

  const limits = problemsOf(checkMenuLimits(menu, goal));
  if (limits.length > 0) return toCheckResult(limits);

  return toCheckResult(
    findWordsToAvoid(menu, wordsToAvoid).length > 0 ? ["word-to-avoid"] : [],
  );
}
