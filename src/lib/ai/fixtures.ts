import { EXERCISE_LIMITS } from "../safety/limits";
import type { CatalogExercise, ExerciseMonth, Menu } from "../safety/types";
import { catalogForLevel } from "../test-mode/catalog";
import type { TestProfile } from "../test-mode/test-profiles";

import type { AiProvider, AiRequest } from "./provider";

/** For tests only: what a valid reply from the agent looks like. */
export function validExerciseMonth(profile: TestProfile): ExerciseMonth {
  const strength = catalogForLevel(profile.fitnessLevel).filter(
    (exercise): exercise is Extract<CatalogExercise, { start: unknown }> =>
      exercise.type !== "aerobic",
  );
  const strengthDays =
    EXERCISE_LIMITS.strengthDaysPerWeek[profile.fitnessLevel].min;
  const minutes = [150, 165, 181, 199];

  return {
    weeks: minutes.map((weekMinutes, week) => ({
      days: Array.from({ length: strengthDays }, (_unused, index) => ({
        day: index + 1,
        aerobic:
          index === 0
            ? [
                {
                  exerciseKey: "brisk-walking",
                  minutes: weekMinutes,
                  intensity: "moderate",
                },
              ]
            : [],
        strength: strength.map((exercise) => ({
          exerciseKey: exercise.key,
          sets: exercise.start.sets,
          repetitions:
            exercise.start.repetitions +
            (exercise.type === "no-load" ? week : 0),
          loadKg: exercise.start.loadKg,
        })),
      })),
    })),
  };
}

export function validMenu(profile: TestProfile): Menu {
  const meal = (name: string, ingredient: string) => ({
    name,
    calories: 600,
    ingredients: [{ name: ingredient, portion: "one cup" }],
  });

  return {
    days: Array.from({ length: 7 }, (_unused, index) => ({
      day: index + 1,
      meals: [
        meal("Morning oats", "Oats"),
        meal("Lentil stew", "Lentils"),
        meal("Rice and beans", "Rice"),
      ],
    })),
    ...(profile.goal === "weight-loss" ? { expectedWeeklyLossKg: 0.5 } : {}),
  };
}

/** An error like the one the Gemini library throws for an HTTP status. */
export function httpError(status: number): Error {
  return Object.assign(new Error("request details that must never be shown"), {
    status,
  });
}

/** The menu as the agent sends it, which always includes the weekly loss field. */
export function menuReply(menu: Menu): string {
  return JSON.stringify({
    expectedWeeklyLossKg: null,
    ...menu,
  });
}

/** A provider that replies from a list, and records every request it receives. */
export function fakeProvider(replies: (string | Error)[]) {
  const requests: AiRequest[] = [];
  const provider: AiProvider = {
    async generate(request) {
      requests.push(request);
      const reply = replies[requests.length - 1];
      if (reply === undefined) throw new Error("no reply set up");
      if (reply instanceof Error) throw reply;
      return reply;
    },
  };
  return { provider, requests };
}

export function validReplies(profile: TestProfile): string[] {
  return [
    JSON.stringify(validExerciseMonth(profile)),
    menuReply(validMenu(profile)),
  ];
}
