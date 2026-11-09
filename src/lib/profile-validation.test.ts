import { describe, expect, test } from "vitest";

import {
  validateProfile,
  type ProfileField,
  type ProfileFormInput,
} from "./profile-validation";
import { WORDING } from "./wording";

// Height and weight are deliberately unrealistic test values, not health data.
const VALID: ProfileFormInput = {
  age: "18",
  heightCm: "1",
  weightKg: "1",
  fitnessLevel: "beginner",
  goal: "toning",
  eatingDisorderAnswer: "no",
  medicalConditionAnswer: "no",
};

function errorFor(field: ProfileField, value: string) {
  const result = validateProfile({ ...VALID, [field]: value });
  return result.ok ? undefined : result.errors[field];
}

test("accepts valid input and converts the numbers", () => {
  expect(validateProfile(VALID)).toEqual({
    ok: true,
    values: {
      age: 18,
      heightCm: 1,
      weightKg: 1,
      fitnessLevel: "beginner",
      goal: "toning",
      eatingDisorderAnswer: "no",
      medicalConditionAnswer: "no",
    },
  });
});

describe("eligibility questions", () => {
  describe.each(["eatingDisorderAnswer", "medicalConditionAnswer"] as const)(
    "%s",
    (field) => {
      test.each(["yes", "no"])("accepts %s", (value) => {
        expect(errorFor(field, value)).toBeUndefined();
      });

      test.each(["", "maybe", "YES", "true", "__proto__"])(
        "refuses %j",
        (value) => {
          expect(errorFor(field, value)).toBe(
            WORDING.eligibility.answerRequired,
          );
        },
      );
    },
  );

  test("a yes still saves, so that the rule can be applied", () => {
    expect(
      validateProfile({ ...VALID, eatingDisorderAnswer: "yes" }).ok,
    ).toBe(true);
  });
});

describe("the weight loss goal and BMI", () => {
  const input = (weightKg: string, goal: string): ProfileFormInput => ({
    ...VALID,
    heightCm: "100",
    weightKg,
    goal,
  });

  test("a BMI just under the limit refuses weight loss with the approved message", () => {
    const result = validateProfile(input("18.49", "weight-loss"));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.goal).toBe(WORDING.eligibility.noWeightLossPlan);
    }
  });

  test("a BMI of exactly the limit allows weight loss", () => {
    expect(validateProfile(input("18.5", "weight-loss")).ok).toBe(true);
  });

  test.each(["toning", "muscle-building"])(
    "the same BMI still allows %s",
    (goal) => {
      expect(validateProfile(input("18.49", goal)).ok).toBe(true);
    },
  );
});

describe("age", () => {
  test("an age of 17 gets the under-18 message", () => {
    expect(errorFor("age", "17")).toBe(WORDING.profile.underAge);
  });

  test("an age of 18 is accepted", () => {
    expect(errorFor("age", "18")).toBeUndefined();
  });

  test.each(["18.5", "-18", "", "  ", "abc", "1e2", "9".repeat(400)])(
    "%j is refused as invalid",
    (age) => {
      expect(errorFor("age", age)).toBe(WORDING.profile.ageInvalid);
    },
  );
});

describe.each([
  ["heightCm", WORDING.profile.heightInvalid],
  ["weightKg", WORDING.profile.weightInvalid],
] as const)("%s", (field, message) => {
  test.each(["1", "0.5", "1000000", " 2 "])(
    "accepts the positive number %j, with no other range",
    (value) => {
      expect(errorFor(field, value)).toBeUndefined();
    },
  );

  test.each(["0", "0.0", "-1", "", "abc", "1e3", "1,5", "Infinity", "9".repeat(400)])(
    "refuses %j",
    (value) => {
      expect(errorFor(field, value)).toBe(message);
    },
  );
});

describe("choices", () => {
  test.each(["beginner", "intermediate", "experienced"])(
    "accepts the fitness level %s",
    (value) => {
      expect(errorFor("fitnessLevel", value)).toBeUndefined();
    },
  );

  test.each(["weight-loss", "toning", "muscle-building"])(
    "accepts the goal %s",
    (value) => {
      expect(errorFor("goal", value)).toBeUndefined();
    },
  );

  test.each(["", "expert", "__proto__", "constructor"])(
    "refuses %j as a fitness level or goal",
    (value) => {
      expect(errorFor("fitnessLevel", value)).toBe(
        WORDING.profile.fitnessLevelInvalid,
      );
      expect(errorFor("goal", value)).toBe(WORDING.profile.goalInvalid);
    },
  );
});

test("reports every invalid field at once", () => {
  const result = validateProfile({
    age: "17",
    heightCm: "0",
    weightKg: "0",
    fitnessLevel: "",
    goal: "",
    eatingDisorderAnswer: "",
    medicalConditionAnswer: "",
  });

  expect(result.ok).toBe(false);
  if (!result.ok) expect(Object.keys(result.errors)).toHaveLength(7);
});
