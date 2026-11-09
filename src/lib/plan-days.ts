import { addDays, daysBetween } from "./dates";
import { checkFirstWeek, checkNextWeek } from "./safety/exercise-limits";
import { EXERCISE_LIMITS } from "./safety/limits";
import { WEEKS_IN_MONTH } from "./safety/month-limits";
import type {
  ExerciseMonth,
  ExerciseWeek,
  Menu,
  MenuIngredient,
  SafetyFitnessLevel,
} from "./safety/types";
import { EXERCISE_CATALOG } from "./test-mode/catalog";

/**
 * Works out what a plan says for any day, from the saved plan, ticks, marks and
 * date. Plain code with no database or UI, so that it can be tested across every
 * day with a fake clock.
 */
export const DAYS_IN_PLAN = 28;
const DAYS_IN_WEEK = 7;

export type PlanPosition =
  | { status: "before-start" }
  | { status: "active"; day: number }
  | { status: "ended" };

export function planPosition(startDate: string, today: string): PlanPosition {
  const day = daysBetween(startDate, today) + 1;
  if (day < 1) return { status: "before-start" };
  if (day > DAYS_IN_PLAN) return { status: "ended" };
  return { status: "active", day };
}

export function weekOfDay(day: number): number {
  return Math.ceil(day / DAYS_IN_WEEK);
}

/** The day within a week, from 1 to 7, which is also the repeating menu's day. */
export function weekdayOfDay(day: number): number {
  return ((day - 1) % DAYS_IN_WEEK) + 1;
}

export function isPlanDay(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= DAYS_IN_PLAN;
}

export type LoadMark = { exerciseKey: string; date: string };

export type PlanProgress = {
  /** The dates with at least one exercise from this plan ticked. */
  exerciseTickDates: readonly string[];
  loadMarks: readonly LoadMark[];
};

export type WorkedOutWeek = { step: number; week: ExerciseWeek };

/** A rise of at most 5%, rounded down to 0.1 kg, so rounding can't pass the limit. */
export function raisedLoad(loadKg: number): number {
  const raised = loadKg * (1 + EXERCISE_LIMITS.loadWeeklyIncrease);
  return Math.floor(raised * 10 + 1e-9) / 10;
}

function datesInWeek(startDate: string, week: number): string[] {
  return Array.from({ length: DAYS_IN_WEEK }, (_unused, index) =>
    addDays(startDate, (week - 1) * DAYS_IN_WEEK + index),
  );
}

function withLoads(week: ExerciseWeek, loads: Map<string, number>): ExerciseWeek {
  return {
    days: week.days.map((day) => ({
      ...day,
      strength: day.strength.map((item) => {
        const loadKg = loads.get(item.exerciseKey);
        return loadKg === undefined ? item : { ...item, loadKg };
      }),
    })),
  };
}

/**
 * The four weeks as they stand on a date. A finished week with no exercise ticked
 * holds the next week at the same step. Weeks still to come assume one step each,
 * which is why later days are labeled as able to change. Loads rise only for an
 * exercise marked in the week before, and every week is checked against the safety
 * limits again. Returns null if any week fails, so the plan isn't shown.
 */
export function workOutWeeks(input: {
  month: ExerciseMonth;
  level: SafetyFitnessLevel;
  startDate: string;
  today: string;
  progress: PlanProgress;
}): WorkedOutWeek[] | null {
  const { month, level, startDate, today, progress } = input;
  if (month.weeks.length !== WEEKS_IN_MONTH) return null;

  const context = { level, catalog: EXERCISE_CATALOG };
  const ticked = new Set(progress.exerciseTickDates);
  const position = planPosition(startDate, today);
  const currentWeek =
    position.status === "active"
      ? weekOfDay(position.day)
      : position.status === "ended"
        ? WEEKS_IN_MONTH + 1
        : 1;

  const loads = new Map<string, number>();
  for (const item of month.weeks[0].days.flatMap((day) => day.strength)) {
    if (item.loadKg !== null) loads.set(item.exerciseKey, item.loadKg);
  }

  const first = withLoads(month.weeks[0], loads);
  if (!checkFirstWeek(first, context).ok) return null;
  const weeks: WorkedOutWeek[] = [{ step: 1, week: first }];

  for (let number = 2; number <= WEEKS_IN_MONTH; number++) {
    const previous = weeks[number - 2];
    const previousDates = datesInWeek(startDate, number - 1);
    const hold =
      number <= currentWeek && !previousDates.some((date) => ticked.has(date));
    const step = hold
      ? previous.step
      : Math.min(previous.step + 1, WEEKS_IN_MONTH);

    const markedLoadKeys = [
      ...new Set(
        progress.loadMarks
          .filter(({ date }) => previousDates.includes(date))
          .map(({ exerciseKey }) => exerciseKey),
      ),
    ].filter((key) => loads.has(key));

    // At most one rise per week, however many times an exercise was marked.
    for (const key of markedLoadKeys) {
      loads.set(key, raisedLoad(loads.get(key) as number));
    }

    const week = withLoads(month.weeks[step - 1], loads);
    if (!checkNextWeek(week, previous.week, { ...context, markedLoadKeys }).ok) {
      return null;
    }
    weeks.push({ step, week });
  }

  return weeks;
}

export type AmountChange = "same" | "increased" | null;

export type PlanExerciseItem = {
  /** Unique within a plan day, and stored with each tick. */
  key: string;
  exerciseKey: string;
  name: string;
} & (
  | { kind: "aerobic"; minutes: number }
  | {
      kind: "no-load" | "load";
      sets: number;
      repetitions: number;
      loadKg: number | null;
      change: AmountChange;
    }
);

export type PlanMealItem = {
  key: string;
  name: string;
  calories: number;
  ingredients: readonly MenuIngredient[];
};

export type PlanDay = {
  day: number;
  week: number;
  date: string;
  exercises: PlanExerciseItem[];
  meals: PlanMealItem[];
  totalCalories: number;
  aerobicMinutes: number;
  aerobicChange: AmountChange;
};

export function aerobicMinutesOf(week: ExerciseWeek): number {
  return week.days
    .flatMap((day) => day.aerobic)
    .reduce((total, item) => total + item.minutes, 0);
}

function nameOf(exerciseKey: string): string {
  return (
    EXERCISE_CATALOG.find((exercise) => exercise.key === exerciseKey)?.name ??
    exerciseKey
  );
}

/** Tick keys start with this, so a plan's ticks can be told from any other. */
export function planKeyPrefix(planId: string): string {
  return `plan:${planId}:`;
}

export function buildPlanDay(input: {
  planId: string;
  startDate: string;
  weeks: readonly WorkedOutWeek[];
  menu: Menu;
  day: number;
}): PlanDay {
  const { planId, startDate, weeks, menu, day } = input;
  const week = weekOfDay(day);
  const weekday = weekdayOfDay(day);
  const prefix = planKeyPrefix(planId);

  const current = weeks[week - 1].week;
  const previous = week > 1 ? weeks[week - 2].week : null;
  const scheduled = current.days.find((entry) => entry.day === weekday);

  const previousStrength = new Map(
    (previous?.days ?? [])
      .flatMap((entry) => entry.strength)
      .map((item) => [item.exerciseKey, item]),
  );

  const exercises: PlanExerciseItem[] = [
    ...(scheduled?.aerobic ?? []).map((item, index) => ({
      key: `${prefix}aerobic:${index}`,
      exerciseKey: item.exerciseKey,
      name: nameOf(item.exerciseKey),
      kind: "aerobic" as const,
      minutes: item.minutes,
    })),
    ...(scheduled?.strength ?? []).map((item, index) => {
      const before = previousStrength.get(item.exerciseKey);
      const increased =
        before !== undefined &&
        (item.repetitions > before.repetitions ||
          (item.loadKg ?? 0) > (before.loadKg ?? 0));
      return {
        key: `${prefix}strength:${index}`,
        exerciseKey: item.exerciseKey,
        name: nameOf(item.exerciseKey),
        kind: item.loadKg === null ? ("no-load" as const) : ("load" as const),
        sets: item.sets,
        repetitions: item.repetitions,
        loadKg: item.loadKg,
        change: (before === undefined
          ? null
          : increased
            ? "increased"
            : "same") as AmountChange,
      };
    }),
  ];

  const menuDay = menu.days.find((entry) => entry.day === weekday);
  const meals: PlanMealItem[] = (menuDay?.meals ?? []).map((meal, index) => ({
    key: `${prefix}meal:${index}`,
    name: meal.name,
    calories: meal.calories,
    ingredients: meal.ingredients,
  }));

  const aerobicMinutes = aerobicMinutesOf(current);

  return {
    day,
    week,
    date: addDays(startDate, day - 1),
    exercises,
    meals,
    totalCalories: meals.reduce((total, meal) => total + meal.calories, 0),
    aerobicMinutes,
    aerobicChange: previous
      ? aerobicMinutes > aerobicMinutesOf(previous)
        ? "increased"
        : "same"
      : null,
  };
}
