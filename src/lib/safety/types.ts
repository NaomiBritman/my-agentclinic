export type SafetyFitnessLevel = "beginner" | "intermediate" | "experienced";

export type SafetyGoal = "weight-loss" | "toning" | "muscle-building";

/** The result of a check. Problem codes are for code and tests, not for people. */
export type CheckResult = { ok: true } | { ok: false; problems: string[] };

export function toCheckResult(problems: string[]): CheckResult {
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

export type StartingAmount = {
  sets: number;
  repetitions: number;
  loadKg: number | null;
};

export type CatalogExercise =
  | {
      key: string;
      name: string;
      levels: readonly SafetyFitnessLevel[];
      type: "aerobic";
    }
  | {
      key: string;
      name: string;
      levels: readonly SafetyFitnessLevel[];
      type: "no-load" | "load";
      start: StartingAmount;
    };

export type AerobicItem = {
  exerciseKey: string;
  minutes: number;
  intensity: string;
};

export type StrengthItem = StartingAmount & {
  exerciseKey: string;
};

export type ExerciseDay = {
  day: number;
  aerobic: AerobicItem[];
  strength: StrengthItem[];
};

export type ExerciseWeek = {
  days: ExerciseDay[];
};

export type ExerciseMonth = {
  weeks: ExerciseWeek[];
};

export type MenuIngredient = {
  name: string;
  /** Gemini's estimate, such as "half a cup". */
  portion: string;
};

export type MenuMeal = {
  name: string;
  calories: number;
  ingredients: MenuIngredient[];
};

export type MenuDay = {
  day: number;
  meals: MenuMeal[];
};

export type Menu = {
  days: MenuDay[];
  expectedWeeklyLossKg?: number;
};
