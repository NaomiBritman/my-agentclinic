import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

import {
  calculateBmi,
  getPlanAccess,
  isWeightLossRefusedByBmi,
  type EligibilityDetails,
} from "./eligibility";
import { checkFirstWeek, checkNextWeek } from "./exercise-limits";
import {
  ADULT_AGE,
  ELIGIBILITY_LIMITS,
  EXERCISE_LIMITS,
  NUTRITION_LIMITS,
} from "./limits";
import { checkMenuLimits } from "./nutrition-limits";
import type {
  CatalogExercise,
  ExerciseDay,
  ExerciseWeek,
  Menu,
  SafetyFitnessLevel,
  StrengthItem,
} from "./types";

// A small catalog for these tests only. It has round amounts that aren't
// approved values, because the real catalog comes with the test profiles.
const CATALOG: CatalogExercise[] = [
  {
    key: "walk",
    name: "Walk",
    levels: ["beginner", "intermediate", "experienced"],
    type: "aerobic",
  },
  {
    key: "no-load-beginner",
    name: "No load",
    levels: ["beginner"],
    type: "no-load",
    start: { sets: 2, repetitions: 10, loadKg: null },
  },
  {
    key: "load-intermediate",
    name: "Load",
    levels: ["intermediate"],
    type: "load",
    start: { sets: 3, repetitions: 10, loadKg: 100 },
  },
  {
    key: "no-load-intermediate",
    name: "No load two",
    levels: ["intermediate"],
    type: "no-load",
    start: { sets: 3, repetitions: 10, loadKg: null },
  },
  {
    key: "load-experienced",
    name: "Load three",
    levels: ["experienced"],
    type: "load",
    start: { sets: 3, repetitions: 10, loadKg: 100 },
  },
];

const NO_LOAD: StrengthItem = {
  exerciseKey: "no-load-beginner",
  sets: 2,
  repetitions: 10,
  loadKg: null,
};

const LOAD: StrengthItem = {
  exerciseKey: "load-intermediate",
  sets: 3,
  repetitions: 10,
  loadKg: 100,
};

function week(
  minutes: number,
  strength: StrengthItem[],
  strengthDays: number,
  intensity = "moderate",
): ExerciseWeek {
  const days: ExerciseDay[] = [
    {
      day: 1,
      aerobic: [{ exerciseKey: "walk", minutes, intensity }],
      strength: strengthDays >= 1 ? strength : [],
    },
  ];
  for (let index = 2; index <= strengthDays; index++) {
    days.push({ day: index, aerobic: [], strength });
  }
  return { days };
}

const beginner = (level: SafetyFitnessLevel = "beginner") => ({
  level,
  catalog: CATALOG,
});

function problems(result: ReturnType<typeof checkFirstWeek>): string[] {
  return result.ok ? [] : result.problems;
}

describe("limit values match the approved list", () => {
  const approved = readFileSync("specs/safety-limits.md", "utf8");

  test.each([
    "| Aerobic exercise | 150 to 300 moderate minutes per week | WHO 2020 |",
    "| Aerobic cap | Never more than 300 moderate minutes per week | Owner decision |",
    "| Intensity | Plans use moderate intensity only | Owner decision |",
    "| Strength, Beginner | 2 to 3 days per week | ACSM 2009 |",
    "| Strength, Intermediate | 3 to 4 days per week | ACSM 2009 |",
    "| Strength, Experienced | 4 to 5 days per week | ACSM 2009 |",
    "At most 5% per week",
    "| Aerobic weekly increase | At most 10% per week",
    "| No-load exercise weekly increase | At most 2 extra repetitions per set",
    "| Beginner first week, aerobic | At most 150 moderate minutes",
    "| Weight loss goal | At most 0.9 kg per week | CDC |",
    "| Menus | Never below 1,500 kcal per day | Owner decision |",
    "| Has a BMI under 18.5 | Weight loss | WHO |",
  ])("the approved list says %j", (line) => {
    expect(approved).toContain(line);
  });

  test("the module holds those values", () => {
    expect(ADULT_AGE).toBe(18);
    expect(ELIGIBILITY_LIMITS).toEqual({ minWeightLossBmi: 18.5 });
    expect(EXERCISE_LIMITS).toEqual({
      aerobicMinutesPerWeek: { min: 150, max: 300 },
      beginnerFirstWeekAerobicMaxMinutes: 150,
      intensity: "moderate",
      strengthDaysPerWeek: {
        beginner: { min: 2, max: 3 },
        intermediate: { min: 3, max: 4 },
        experienced: { min: 4, max: 5 },
      },
      aerobicWeeklyIncrease: 0.1,
      noLoadExtraRepetitionsPerSet: 2,
      loadWeeklyIncrease: 0.05,
    });
    expect(NUTRITION_LIMITS).toEqual({
      minDailyCalories: 1500,
      maxWeeklyLossKg: 0.9,
    });
  });
});

test("the safety module imports only its own files", () => {
  const folder = join("src", "lib", "safety");
  const sources = readdirSync(folder).filter(
    (file) => file.endsWith(".ts") && !file.endsWith(".test.ts"),
  );
  expect(sources.length).toBeGreaterThanOrEqual(5);

  for (const file of sources) {
    const source = readFileSync(join(folder, file), "utf8");
    const imports = [...source.matchAll(/from\s+"([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(imports.filter((name) => !/^\.\/[\w-]+$/.test(name))).toEqual([]);
  }
});

describe("eligibility", () => {
  const eligible: EligibilityDetails = {
    eatingDisorderAnswer: "no",
    medicalConditionAnswer: "no",
    heightCm: 100,
    weightKg: 50,
  };

  test("BMI is weight in kilograms over height in metres squared", () => {
    expect(calculateBmi(100, 18.5)).toBe(18.5);
    expect(calculateBmi(200, 80)).toBe(20);
  });

  test("a BMI just under the limit refuses weight loss, and exactly at it doesn't", () => {
    expect(isWeightLossRefusedByBmi(100, 18.49)).toBe(true);
    expect(isWeightLossRefusedByBmi(100, 18.5)).toBe(false);
  });

  test("no rounding lifts a BMI over the limit", () => {
    expect(isWeightLossRefusedByBmi(100, 18.4999)).toBe(true);
  });

  test.each([
    [0, 50],
    [50, 0],
    [Number.NaN, 50],
  ])("a BMI that can't be worked out is refused: %s cm, %s kg", (height, weight) => {
    expect(isWeightLossRefusedByBmi(height, weight)).toBe(true);
  });

  test("two no answers leave every goal available", () => {
    expect(getPlanAccess(eligible)).toEqual({
      status: "available",
      hiddenGoals: [],
    });
  });

  test.each([
    ["eatingDisorderAnswer", "yes", "no"],
    ["medicalConditionAnswer", "no", "yes"],
  ] as const)("a yes to %s means no plan for any goal", (_name, first, second) => {
    expect(
      getPlanAccess({
        ...eligible,
        eatingDisorderAnswer: first,
        medicalConditionAnswer: second,
      }),
    ).toEqual({ status: "no-plan" });
  });

  test("a yes counts even if the other question is unanswered", () => {
    expect(
      getPlanAccess({
        ...eligible,
        eatingDisorderAnswer: "yes",
        medicalConditionAnswer: null,
      }),
    ).toEqual({ status: "no-plan" });
  });

  test.each([
    [null, null],
    [null, "no"],
    ["no", null],
  ] as const)("unanswered questions leave plans unavailable: %s, %s", (first, second) => {
    expect(
      getPlanAccess({
        ...eligible,
        eatingDisorderAnswer: first,
        medicalConditionAnswer: second,
      }),
    ).toEqual({ status: "answers-missing" });
  });

  test("a low BMI hides weight loss only", () => {
    expect(getPlanAccess({ ...eligible, weightKg: 18.49 })).toEqual({
      status: "available",
      hiddenGoals: ["weight-loss"],
    });
  });

  test("a yes outranks a low BMI", () => {
    expect(
      getPlanAccess({
        ...eligible,
        weightKg: 18.49,
        medicalConditionAnswer: "yes",
      }),
    ).toEqual({ status: "no-plan" });
  });
});

describe("first week", () => {
  const intermediate = beginner("intermediate");

  test("a week within every limit passes", () => {
    expect(checkFirstWeek(week(200, [LOAD], 3), intermediate)).toEqual({
      ok: true,
    });
  });

  test.each([
    [150, []],
    [300, []],
    [149, ["aerobic-too-low"]],
    [301, ["aerobic-too-high"]],
  ])("%i aerobic minutes give %j", (minutes, expected) => {
    expect(problems(checkFirstWeek(week(minutes, [LOAD], 3), intermediate))).toEqual(
      expected,
    );
  });

  test.each(["vigorous", "light", "", "Moderate"])(
    "%j intensity is refused",
    (intensity) => {
      expect(
        problems(checkFirstWeek(week(200, [LOAD], 3, intensity), intermediate)),
      ).toContain("intensity");
    },
  );

  test("a Beginner's first week can have 150 aerobic minutes, but not 151", () => {
    expect(problems(checkFirstWeek(week(150, [NO_LOAD], 2), beginner()))).toEqual([]);
    expect(problems(checkFirstWeek(week(151, [NO_LOAD], 2), beginner()))).toEqual([
      "beginner-first-week-aerobic",
    ]);
  });

  test("the Beginner limit doesn't apply to other levels", () => {
    expect(problems(checkFirstWeek(week(151, [LOAD], 3), intermediate))).toEqual([]);
  });

  describe.each([
    ["beginner", NO_LOAD, 2, 3, 150],
    ["intermediate", LOAD, 3, 4, 200],
    [
      "experienced",
      { ...LOAD, exerciseKey: "load-experienced" },
      4,
      5,
      200,
    ],
  ] as const)("%s strength days", (level, item, min, max, minutes) => {
    const context = beginner(level);

    test.each([min, max])("%i days pass", (days) => {
      expect(problems(checkFirstWeek(week(minutes, [item], days), context))).toEqual([]);
    });

    test.each([min - 1, max + 1])("%i days are refused", (days) => {
      expect(
        problems(checkFirstWeek(week(minutes, [item], days), context)),
      ).toContain("strength-days");
    });
  });

  test("an unknown exercise is refused", () => {
    expect(
      problems(
        checkFirstWeek(
          week(200, [{ ...LOAD, exerciseKey: "made-up" }], 3),
          intermediate,
        ),
      ),
    ).toContain("unknown-exercise");
  });

  test("an exercise from another level is refused", () => {
    expect(
      problems(checkFirstWeek(week(200, [NO_LOAD], 3), intermediate)),
    ).toContain("unknown-exercise");
  });

  test("an aerobic exercise can't be listed as strength, or the reverse", () => {
    expect(
      problems(
        checkFirstWeek(week(200, [{ ...LOAD, exerciseKey: "walk" }], 3), intermediate),
      ),
    ).toContain("unknown-exercise");

    const reversed = week(200, [LOAD], 3);
    reversed.days[0].aerobic[0].exerciseKey = "load-intermediate";
    expect(problems(checkFirstWeek(reversed, intermediate))).toContain(
      "unknown-exercise",
    );
  });

  test.each([
    ["sets", { sets: 4 }],
    ["repetitions", { repetitions: 11 }],
    ["load", { loadKg: 101 }],
  ])("first week %s that differ from the catalog are refused", (_name, change) => {
    expect(
      problems(checkFirstWeek(week(200, [{ ...LOAD, ...change }], 3), intermediate)),
    ).toEqual(["not-catalog-amount"]);
  });

  test("a loaded exercise needs a load, and a no-load exercise can't have one", () => {
    expect(
      problems(
        checkFirstWeek(week(200, [{ ...LOAD, loadKg: null }], 3), intermediate),
      ),
    ).toContain("invalid-load");
    expect(
      problems(checkFirstWeek(week(150, [{ ...NO_LOAD, loadKg: 5 }], 2), beginner())),
    ).toContain("invalid-load");
  });

  test("an exercise can't have different amounts on different days", () => {
    const uneven = week(200, [LOAD], 3);
    uneven.days[1].strength = [{ ...LOAD, repetitions: 11 }];
    expect(problems(checkFirstWeek(uneven, intermediate))).toContain(
      "differing-amounts",
    );
  });

  test.each([
    ["no days", { days: [] }, "no-days"],
    [
      "a day out of range",
      { days: [{ day: 8, aerobic: [], strength: [] }] },
      "invalid-day",
    ],
    [
      "a repeated day",
      {
        days: [
          { day: 1, aerobic: [], strength: [] },
          { day: 1, aerobic: [], strength: [] },
        ],
      },
      "repeated-day",
    ],
    [
      "missing minutes",
      {
        days: [
          {
            day: 1,
            aerobic: [{ exerciseKey: "walk", intensity: "moderate" }],
            strength: [],
          },
        ],
      },
      "invalid-minutes",
    ],
    [
      "fractional minutes",
      {
        days: [
          {
            day: 1,
            aerobic: [{ exerciseKey: "walk", intensity: "moderate", minutes: 150.5 }],
            strength: [],
          },
        ],
      },
      "invalid-minutes",
    ],
    [
      "missing sets",
      {
        days: [
          {
            day: 1,
            aerobic: [],
            strength: [{ exerciseKey: "load-intermediate", repetitions: 10, loadKg: 100 }],
          },
        ],
      },
      "invalid-sets",
    ],
    [
      "negative repetitions",
      {
        days: [
          {
            day: 1,
            aerobic: [],
            strength: [
              { exerciseKey: "load-intermediate", sets: 3, repetitions: -1, loadKg: 100 },
            ],
          },
        ],
      },
      "invalid-repetitions",
    ],
  ])("%s is refused", (_name, input, problem) => {
    expect(
      problems(checkFirstWeek(input as unknown as ExerciseWeek, intermediate)),
    ).toContain(problem);
  });
});

describe("next week", () => {
  const context = (markedLoadKeys: string[] = []) => ({
    ...beginner("intermediate"),
    markedLoadKeys,
  });
  const previous = week(200, [LOAD], 3);

  function next(
    change: Partial<StrengthItem> = {},
    minutes = 200,
    marked: string[] = [],
    from: ExerciseWeek = previous,
  ) {
    return problems(
      checkNextWeek(week(minutes, [{ ...LOAD, ...change }], 3), from, context(marked)),
    );
  }

  test("an unchanged week passes", () => {
    expect(next()).toEqual([]);
  });

  test("aerobic minutes can rise by exactly 10%, and no more", () => {
    expect(next({}, 220)).toEqual([]);
    expect(next({}, 221)).toEqual(["aerobic-increase"]);
  });

  test("a rise can't pass the aerobic cap, even within 10%", () => {
    const nearCap = week(290, [LOAD], 3);
    expect(next({}, 300, [], nearCap)).toEqual([]);
    expect(next({}, 301, [], nearCap)).toEqual(["aerobic-too-high"]);
    expect(next({}, 319, [], nearCap)).toEqual(["aerobic-too-high"]);
  });

  test("a Beginner can rise from 150 minutes by the approved increase", () => {
    const beginnerContext = { ...beginner(), markedLoadKeys: [] };
    const first = week(150, [NO_LOAD], 2);
    expect(
      problems(checkNextWeek(week(165, [NO_LOAD], 2), first, beginnerContext)),
    ).toEqual([]);
    expect(
      problems(checkNextWeek(week(166, [NO_LOAD], 2), first, beginnerContext)),
    ).toEqual(["aerobic-increase"]);
  });

  test("a marked load can rise by exactly 5%, and no more", () => {
    const marked = ["load-intermediate"];
    expect(next({ loadKg: 105 }, 200, marked)).toEqual([]);
    expect(next({ loadKg: 105.01 }, 200, marked)).toEqual(["load-increase"]);
  });

  test("rounding doesn't refuse an exact 5% rise on a small load", () => {
    const small = week(200, [{ ...LOAD, loadKg: 6 }], 3);
    expect(next({ loadKg: 6.3 }, 200, ["load-intermediate"], small)).toEqual([]);
  });

  test("an unmarked load can't rise at all", () => {
    expect(next({ loadKg: 100.01 })).toEqual(["load-increase"]);
  });

  test("marking another exercise doesn't let this load rise", () => {
    expect(next({ loadKg: 105 }, 200, ["no-load-intermediate"])).toEqual([
      "load-increase",
    ]);
  });

  describe("no-load exercises", () => {
    const item: StrengthItem = {
      exerciseKey: "no-load-intermediate",
      sets: 3,
      repetitions: 10,
      loadKg: null,
    };
    const from = week(200, [item], 3);
    const check = (repetitions: number) =>
      problems(checkNextWeek(week(200, [{ ...item, repetitions }], 3), from, context()));

    test("can gain 2 repetitions per set, but not 3", () => {
      expect(check(12)).toEqual([]);
      expect(check(13)).toEqual(["repetition-increase"]);
    });

    test("can't lose repetitions", () => {
      expect(check(9)).toEqual(["amount-fell"]);
    });
  });

  test.each([
    ["sets", { sets: 4 }, "changed-sets"],
    ["fewer sets", { sets: 2 }, "changed-sets"],
    ["loaded repetitions", { repetitions: 11 }, "changed-load-repetitions"],
    ["lower load", { loadKg: 99 }, "amount-fell"],
  ])("%s are refused", (_name, change, problem) => {
    expect(next(change, 200, ["load-intermediate"])).toContain(problem);
  });

  test("fewer aerobic minutes are refused", () => {
    expect(next({}, 199)).toEqual(["amount-fell"]);
  });

  test("changing the exercises is refused", () => {
    const changed = week(
      200,
      [{ exerciseKey: "no-load-intermediate", sets: 3, repetitions: 10, loadKg: null }],
      3,
    );
    expect(problems(checkNextWeek(changed, previous, context()))).toContain(
      "changed-exercises",
    );
  });

  test("adding an exercise is refused", () => {
    const added = week(
      200,
      [
        LOAD,
        { exerciseKey: "no-load-intermediate", sets: 3, repetitions: 10, loadKg: null },
      ],
      3,
    );
    expect(problems(checkNextWeek(added, previous, context()))).toContain(
      "changed-exercises",
    );
  });

  test("the limits for every week still apply", () => {
    expect(next({}, 200, [], week(200, [LOAD], 3))).toEqual([]);
    expect(
      problems(checkNextWeek(week(200, [LOAD], 3, "vigorous"), previous, context())),
    ).toContain("intensity");
    expect(
      problems(checkNextWeek(week(200, [LOAD], 5), previous, context())),
    ).toContain("strength-days");
  });
});

describe("menus", () => {
  const menu = (
    calories: number[],
    expectedWeeklyLossKg?: number,
  ): Menu => ({
    days: [
      {
        day: 1,
        meals: calories.map((value, index) => ({
          name: `Meal ${index}`,
          calories: value,
          ingredients: [],
        })),
      },
    ],
    expectedWeeklyLossKg,
  });
  const check = (input: Menu, goal: "weight-loss" | "toning" = "toning") => {
    const result = checkMenuLimits(input, goal);
    return result.ok ? [] : result.problems;
  };

  test("a day at exactly 1,500 calories passes", () => {
    expect(check(menu([500, 500, 500]))).toEqual([]);
  });

  test("a day just under 1,500 calories is refused", () => {
    expect(check(menu([500, 500, 499]))).toEqual(["calories-too-low"]);
  });

  test("every day is checked, not only the average", () => {
    const uneven: Menu = {
      days: [
        { day: 1, meals: [{ name: "A", calories: 3000, ingredients: [] }] },
        { day: 2, meals: [{ name: "B", calories: 1000, ingredients: [] }] },
      ],
    };
    expect(check(uneven)).toEqual(["calories-too-low"]);
  });

  test.each([
    ["no days", { days: [] }, "no-days"],
    ["a day with no meals", { days: [{ day: 1, meals: [] }] }, "no-meals"],
    [
      "missing calories",
      { days: [{ day: 1, meals: [{ name: "A", ingredients: [] }] }] },
      "invalid-calories",
    ],
    [
      "negative calories",
      {
        days: [
          {
            day: 1,
            meals: [
              { name: "A", calories: 5000, ingredients: [] },
              { name: "B", calories: -1, ingredients: [] },
            ],
          },
        ],
      },
      "invalid-calories",
    ],
    [
      "calories as text",
      {
        days: [
          { day: 1, meals: [{ name: "A", calories: "5000", ingredients: [] }] },
        ],
      },
      "invalid-calories",
    ],
  ])("%s is refused", (_name, input, problem) => {
    expect(check(input as unknown as Menu)).toEqual([problem]);
  });

  test("a weight loss menu can state exactly 0.9 kg per week, and no more", () => {
    expect(check(menu([1500], 0.9), "weight-loss")).toEqual([]);
    expect(check(menu([1500], 0.91), "weight-loss")).toEqual([
      "weekly-loss-too-high",
    ]);
  });

  test.each([
    ["missing", undefined],
    ["negative", -0.1],
    ["not a number", Number.NaN],
  ])("a weight loss menu with a %s weekly loss is refused", (_name, loss) => {
    expect(check(menu([1500], loss), "weight-loss")).toEqual([
      "weekly-loss-missing",
    ]);
  });

  test("other goals don't need a weekly loss", () => {
    expect(check(menu([1500]), "toning")).toEqual([]);
  });
});
