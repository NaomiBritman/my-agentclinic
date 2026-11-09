import type { CatalogExercise, SafetyFitnessLevel } from "../safety/types";

/**
 * The approved exercises and starting amounts, recorded in
 * specs/safety-limits.md. Plans can use only these.
 */
export const EXERCISE_CATALOG: readonly CatalogExercise[] = [
  {
    key: "brisk-walking",
    name: "Brisk walking",
    levels: ["beginner", "intermediate", "experienced"],
    type: "aerobic",
  },
  {
    key: "easy-cycling",
    name: "Easy cycling",
    levels: ["beginner", "intermediate", "experienced"],
    type: "aerobic",
  },
  {
    key: "wall-push-ups",
    name: "Wall push-ups",
    levels: ["beginner"],
    type: "no-load",
    start: { sets: 2, repetitions: 8, loadKg: null },
  },
  {
    key: "chair-squats",
    name: "Chair squats",
    levels: ["beginner"],
    type: "no-load",
    start: { sets: 2, repetitions: 8, loadKg: null },
  },
  {
    key: "glute-bridges",
    name: "Glute bridges",
    levels: ["beginner"],
    type: "no-load",
    start: { sets: 2, repetitions: 8, loadKg: null },
  },
  {
    key: "knee-push-ups",
    name: "Knee push-ups",
    levels: ["intermediate"],
    type: "no-load",
    start: { sets: 3, repetitions: 8, loadKg: null },
  },
  {
    key: "goblet-squats-intermediate",
    name: "Goblet squats",
    levels: ["intermediate"],
    type: "load",
    start: { sets: 3, repetitions: 8, loadKg: 6 },
  },
  {
    key: "dumbbell-rows-intermediate",
    name: "Dumbbell rows",
    levels: ["intermediate"],
    type: "load",
    start: { sets: 3, repetitions: 8, loadKg: 6 },
  },
  {
    key: "push-ups",
    name: "Push-ups",
    levels: ["experienced"],
    type: "no-load",
    start: { sets: 3, repetitions: 10, loadKg: null },
  },
  {
    key: "goblet-squats-experienced",
    name: "Goblet squats",
    levels: ["experienced"],
    type: "load",
    start: { sets: 3, repetitions: 8, loadKg: 12 },
  },
  {
    key: "dumbbell-rows-experienced",
    name: "Dumbbell rows",
    levels: ["experienced"],
    type: "load",
    start: { sets: 3, repetitions: 8, loadKg: 12 },
  },
];

export function catalogForLevel(
  level: SafetyFitnessLevel,
): readonly CatalogExercise[] {
  return EXERCISE_CATALOG.filter((exercise) => exercise.levels.includes(level));
}
