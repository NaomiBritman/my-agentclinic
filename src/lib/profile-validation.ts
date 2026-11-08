import { WORDING } from "./wording";

// The adults-only rule from the mission. Height and weight have no range,
// because any range would be an invented health number.
const ADULT_AGE = 18;

export const FITNESS_LEVELS = Object.keys(
  WORDING.profile.fitnessLevels,
) as (keyof typeof WORDING.profile.fitnessLevels)[];

export const GOALS = Object.keys(
  WORDING.profile.goals,
) as (keyof typeof WORDING.profile.goals)[];

export type FitnessLevel = (typeof FITNESS_LEVELS)[number];
export type Goal = (typeof GOALS)[number];

export type ProfileValues = {
  age: number;
  heightCm: number;
  weightKg: number;
  fitnessLevel: FitnessLevel;
  goal: Goal;
};

export type ProfileField = keyof ProfileValues;

export type ProfileFormInput = Record<ProfileField, string>;

export type ProfileErrors = Partial<Record<ProfileField, string>>;

export type ProfileValidation =
  | { ok: true; values: ProfileValues }
  | { ok: false; errors: ProfileErrors };

function parseWholeNumber(text: string): number | null {
  if (!/^\d+$/.test(text.trim())) return null;
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

function parsePositiveNumber(text: string): number | null {
  if (!/^\d+(\.\d+)?$/.test(text.trim())) return null;
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function isOneOf<T extends string>(
  options: readonly T[],
  text: string,
): text is T {
  return (options as readonly string[]).includes(text);
}

/** Validates untrusted profile input. This runs on the server. */
export function validateProfile(input: ProfileFormInput): ProfileValidation {
  const errors: ProfileErrors = {};

  const age = parseWholeNumber(input.age);
  if (age === null) errors.age = WORDING.profile.ageInvalid;
  else if (age < ADULT_AGE) errors.age = WORDING.profile.underAge;

  const heightCm = parsePositiveNumber(input.heightCm);
  if (heightCm === null) errors.heightCm = WORDING.profile.heightInvalid;

  const weightKg = parsePositiveNumber(input.weightKg);
  if (weightKg === null) errors.weightKg = WORDING.profile.weightInvalid;

  const { fitnessLevel, goal } = input;
  if (!isOneOf(FITNESS_LEVELS, fitnessLevel)) {
    errors.fitnessLevel = WORDING.profile.fitnessLevelInvalid;
  }
  if (!isOneOf(GOALS, goal)) errors.goal = WORDING.profile.goalInvalid;

  if (
    age === null ||
    heightCm === null ||
    weightKg === null ||
    Object.keys(errors).length > 0
  ) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    values: {
      age,
      heightCm,
      weightKg,
      fitnessLevel: fitnessLevel as FitnessLevel,
      goal: goal as Goal,
    },
  };
}
