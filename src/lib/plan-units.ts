/**
 * The only labels that may name a health measure, shown beside amounts in a
 * plan. The wording test allows these and refuses those words everywhere else.
 */
export const PLAN_UNITS = {
  aerobicMinutes: "Aerobic minutes",
  strengthDays: "Strength days",
  heightCm: "cm",
  weightKg: "kg",
} as const;
