import type { SafetyFitnessLevel, SafetyGoal } from "../safety/types";

/**
 * Built-in made-up people, approved by the project owner and recorded in
 * specs/safety-limits.md. They describe no real person. These are the only
 * details that may ever be sent to the AI provider.
 */
export type TestProfile = {
  key: string;
  age: number;
  heightCm: number;
  weightKg: number;
  fitnessLevel: SafetyFitnessLevel;
  goal: SafetyGoal;
  allergies: readonly string[];
  dietaryRestrictions: readonly string[];
  /** Checked in code against each menu, and never sent. */
  wordsToAvoid: readonly string[];
};

export const TEST_PROFILES: readonly TestProfile[] = [
  {
    key: "test-a",
    age: 40,
    heightCm: 170,
    weightKg: 80,
    fitnessLevel: "beginner",
    goal: "weight-loss",
    allergies: ["Peanuts"],
    dietaryRestrictions: [],
    wordsToAvoid: [
      "peanut",
      "groundnut",
      "arachis",
      "satay",
      "mixed nuts",
      "nut butter",
    ],
  },
  {
    key: "test-b",
    age: 30,
    heightCm: 165,
    weightKg: 62,
    fitnessLevel: "intermediate",
    goal: "toning",
    allergies: [],
    dietaryRestrictions: ["Vegetarian"],
    wordsToAvoid: [
      "beef",
      "pork",
      "ham",
      "bacon",
      "lamb",
      "mutton",
      "veal",
      "chicken",
      "turkey",
      "duck",
      "fish",
      "salmon",
      "tuna",
      "cod",
      "anchovy",
      "anchovies",
      "sardine",
      "shrimp",
      "prawn",
      "crab",
      "lobster",
      "gelatin",
      "gelatine",
      "meat",
      "sausage",
      "salami",
      "pepperoni",
      "prosciutto",
      "squid",
      "mussel",
      "oyster",
      "clam",
    ],
  },
  {
    key: "test-c",
    age: 25,
    heightCm: 180,
    weightKg: 75,
    fitnessLevel: "experienced",
    goal: "muscle-building",
    allergies: [],
    dietaryRestrictions: [],
    wordsToAvoid: [],
  },
];

export function findTestProfile(key: unknown): TestProfile | null {
  return TEST_PROFILES.find((profile) => profile.key === key) ?? null;
}
