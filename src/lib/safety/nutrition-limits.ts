import { NUTRITION_LIMITS } from "./limits";
import {
  toCheckResult,
  type CheckResult,
  type Menu,
  type SafetyGoal,
} from "./types";

/**
 * Checks a menu against the nutrition limits. The calories and expected weekly
 * loss are Gemini's own figures, so passing doesn't make a menu safe for real
 * use (see specs/safety-limits.md).
 */
export function checkMenuLimits(menu: Menu, goal: SafetyGoal): CheckResult {
  if (!Array.isArray(menu.days) || menu.days.length === 0) {
    return toCheckResult(["no-days"]);
  }

  const problems: string[] = [];

  for (const day of menu.days) {
    if (!Array.isArray(day.meals) || day.meals.length === 0) {
      problems.push("no-meals");
      continue;
    }

    const calories = day.meals.map((meal) => meal.calories);
    if (
      calories.some(
        (value) =>
          typeof value !== "number" || !Number.isFinite(value) || value <= 0,
      )
    ) {
      problems.push("invalid-calories");
      continue;
    }

    const total = calories.reduce((sum, value) => sum + value, 0);
    if (total < NUTRITION_LIMITS.minDailyCalories) {
      problems.push("calories-too-low");
    }
  }

  if (goal === "weight-loss") {
    const loss = menu.expectedWeeklyLossKg;
    if (typeof loss !== "number" || !Number.isFinite(loss) || loss < 0) {
      problems.push("weekly-loss-missing");
    } else if (loss > NUTRITION_LIMITS.maxWeeklyLossKg) {
      problems.push("weekly-loss-too-high");
    }
  }

  return toCheckResult(problems);
}
