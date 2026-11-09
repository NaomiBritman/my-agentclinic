import { ELIGIBILITY_LIMITS } from "./limits";
import type { SafetyGoal } from "./types";

export type EligibilityAnswer = "yes" | "no";

export type EligibilityDetails = {
  eatingDisorderAnswer: EligibilityAnswer | null;
  medicalConditionAnswer: EligibilityAnswer | null;
  heightCm: number;
  weightKg: number;
};

export type PlanAccess =
  | { status: "answers-missing" }
  | { status: "no-plan" }
  | { status: "available"; hiddenGoals: SafetyGoal[] };

/** Weight in kilograms divided by height in metres squared, with no rounding. */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

/** Fails closed: a BMI that can't be worked out counts as refused. */
export function isWeightLossRefusedByBmi(
  heightCm: number,
  weightKg: number,
): boolean {
  const bmi = calculateBmi(heightCm, weightKg);
  return !Number.isFinite(bmi) || bmi < ELIGIBILITY_LIMITS.minWeightLossBmi;
}

/** A yes to either question means no plan for any goal. */
export function getPlanAccess(details: EligibilityDetails): PlanAccess {
  const answers = [details.eatingDisorderAnswer, details.medicalConditionAnswer];

  if (answers.includes("yes")) return { status: "no-plan" };
  if (answers.some((answer) => answer !== "no")) {
    return { status: "answers-missing" };
  }

  return {
    status: "available",
    hiddenGoals: isWeightLossRefusedByBmi(details.heightCm, details.weightKg)
      ? ["weight-loss"]
      : [],
  };
}
