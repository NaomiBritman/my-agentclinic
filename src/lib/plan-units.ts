/**
 * The only labels that may name a health measure, shown beside amounts in a
 * plan. The wording test allows these and refuses those words everywhere else.
 */
export const PLAN_UNITS = {
  aerobicMinutes: "Aerobic minutes",
  aerobicMinutesThisWeek: "Aerobic minutes this week",
  strengthDays: "Strength days",
  heightCm: "cm",
  weightKg: "kg",
  minutes: "min",
  setsOf: "sets of",
  repetitions: "repetitions",
  calories: "kcal",
} as const;

export function formatMinutes(minutes: number): string {
  return `${minutes} ${PLAN_UNITS.minutes}`;
}

export function formatStrength(
  sets: number,
  repetitions: number,
  loadKg: number | null,
): string {
  const amount = `${sets} ${PLAN_UNITS.setsOf} ${repetitions} ${PLAN_UNITS.repetitions}`;
  return loadKg === null ? amount : `${amount} at ${loadKg} ${PLAN_UNITS.weightKg}`;
}

/** Calories are Gemini's own figures, so they are always shown as approximate. */
export function formatCalories(calories: number): string {
  const rounded = Math.round(calories).toLocaleString("en");
  return `About ${rounded} ${PLAN_UNITS.calories}`;
}
