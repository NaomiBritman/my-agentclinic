/**
 * Every approved limit value, in one place. Each one comes from
 * specs/safety-limits.md, and no others may be added without approval.
 */

/** Mission: adults only. */
export const ADULT_AGE = 18;

export const ELIGIBILITY_LIMITS = {
  /** WHO. */
  minWeightLossBmi: 18.5,
} as const;

export const EXERCISE_LIMITS = {
  /** WHO 2020 for the range. The maximum is also an owner decision. */
  aerobicMinutesPerWeek: { min: 150, max: 300 },
  /** Owner decision. */
  beginnerFirstWeekAerobicMaxMinutes: 150,
  /** Owner decision. */
  intensity: "moderate",
  /** ACSM 2009. */
  strengthDaysPerWeek: {
    beginner: { min: 2, max: 3 },
    intermediate: { min: 3, max: 4 },
    experienced: { min: 4, max: 5 },
  },
  /** Owner decision. */
  aerobicWeeklyIncrease: 0.1,
  /** Owner decision. */
  noLoadExtraRepetitionsPerSet: 2,
  /** Owner decision, with ACSM 2-10% as background. */
  loadWeeklyIncrease: 0.05,
} as const;

export const NUTRITION_LIMITS = {
  /** Owner decision. */
  minDailyCalories: 1500,
  /** CDC. */
  maxWeeklyLossKg: 0.9,
} as const;
