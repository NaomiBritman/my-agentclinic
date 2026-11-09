import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { afterEach, describe, expect, test, vi } from "vitest";

import { getPlanAccess } from "../safety/eligibility";
import {
  checkExerciseMonth,
  checkMenuMonth,
  findWordsToAvoid,
} from "../safety/month-limits";
import type { ExerciseMonth, Menu } from "../safety/types";
import { EXERCISE_CATALOG } from "../test-mode/catalog";
import { findTestProfile, TEST_PROFILES } from "../test-mode/test-profiles";

import {
  fakeProvider,
  httpError,
  menuReply,
  validExerciseMonth,
  validMenu,
  validReplies,
} from "./fixtures";
import { generateMonthPlan } from "./generate-plan";
import { parseExerciseMonth, parseMenu } from "./plan-format";
import {
  MAX_RETRIES_PER_BUILD,
  REQUEST_TIMEOUT_MS,
  RETRY_WAIT_MS,
  type AiProvider,
} from "./provider";

const testA = TEST_PROFILES[0];
const testB = TEST_PROFILES[1];
const approved = readFileSync("specs/safety-limits.md", "utf8");

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("the approved test data", () => {
  test.each([
    "| `test-a` | 40 | 170 cm | 80 kg | Beginner | Weight loss | Peanuts | None |",
    "| `test-b` | 30 | 165 cm | 62 kg | Intermediate | Toning | None | Vegetarian |",
    "| `test-c` | 25 | 180 cm | 75 kg | Experienced | Muscle building | None | None |",
  ])("the approved list says %s", (line) => {
    expect(approved).toContain(line);
  });

  test("the profiles hold those values", () => {
    expect(
      TEST_PROFILES.map((profile) => [
        profile.key,
        profile.age,
        profile.heightCm,
        profile.weightKg,
        profile.fitnessLevel,
        profile.goal,
        profile.allergies,
        profile.dietaryRestrictions,
      ]),
    ).toEqual([
      ["test-a", 40, 170, 80, "beginner", "weight-loss", ["Peanuts"], []],
      ["test-b", 30, 165, 62, "intermediate", "toning", [], ["Vegetarian"]],
      ["test-c", 25, 180, 75, "experienced", "muscle-building", [], []],
    ]);
  });

  test.each(TEST_PROFILES.filter((profile) => profile.wordsToAvoid.length > 0))(
    "$key's words to avoid match the approved list",
    (profile) => {
      const row = approved
        .split("\n")
        .find((line) => line.startsWith(`| \`${profile.key}\` | ${profile.wordsToAvoid[0]}`));
      expect(row).toBeDefined();
      const words = (row as string).split("|")[2].split(",").map((word) => word.trim());
      expect([...profile.wordsToAvoid]).toEqual(words);
    },
  );

  test.each(TEST_PROFILES)("$key meets the eligibility rules", (profile) => {
    expect(
      getPlanAccess({
        eatingDisorderAnswer: "no",
        medicalConditionAnswer: "no",
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
      }),
    ).toEqual({ status: "available", hiddenGoals: [] });
    expect(profile.age).toBeGreaterThanOrEqual(18);
  });

  test.each([
    ["wall-push-ups", 2, 8, null],
    ["chair-squats", 2, 8, null],
    ["glute-bridges", 2, 8, null],
    ["knee-push-ups", 3, 8, null],
    ["goblet-squats-intermediate", 3, 8, 6],
    ["dumbbell-rows-intermediate", 3, 8, 6],
    ["push-ups", 3, 10, null],
    ["goblet-squats-experienced", 3, 8, 12],
    ["dumbbell-rows-experienced", 3, 8, 12],
  ])("%s starts at the approved amount", (key, sets, repetitions, loadKg) => {
    const exercise = EXERCISE_CATALOG.find((entry) => entry.key === key);
    expect(exercise && "start" in exercise && exercise.start).toEqual({
      sets,
      repetitions,
      loadKg,
    });
  });

  test("the catalog lists exactly the approved exercises", () => {
    expect(EXERCISE_CATALOG).toHaveLength(11);
    for (const exercise of EXERCISE_CATALOG) {
      expect(approved).toContain(`| ${exercise.name} |`);
    }
  });

  test.each(TEST_PROFILES)("a valid month for $key passes every check", (profile) => {
    expect(
      checkExerciseMonth(validExerciseMonth(profile), {
        level: profile.fitnessLevel,
        catalog: EXERCISE_CATALOG,
      }),
    ).toEqual({ ok: true });
    expect(
      checkMenuMonth(validMenu(profile), profile.goal, profile.wordsToAvoid),
    ).toEqual({ ok: true });
  });
});

function withWeek(
  month: ExerciseMonth,
  week: number,
  change: (draft: ExerciseMonth["weeks"][number]) => void,
): ExerciseMonth {
  const copy = structuredClone(month);
  change(copy.weeks[week]);
  return copy;
}

describe("the month checks", () => {
  const context = { level: testA.fitnessLevel, catalog: EXERCISE_CATALOG };
  const month = validExerciseMonth(testA);
  const check = (input: ExerciseMonth) => {
    const result = checkExerciseMonth(input, context);
    return result.ok ? [] : result.problems;
  };

  test.each([0, 3])("%i weeks are refused", (count) => {
    expect(check({ weeks: month.weeks.slice(0, count) })).toEqual([
      "wrong-week-count",
    ]);
  });

  test("five weeks are refused", () => {
    expect(check({ weeks: [...month.weeks, month.weeks[3]] })).toEqual([
      "wrong-week-count",
    ]);
  });

  test.each([0, 1, 2, 3])("a failure in week %i refuses the whole month", (week) => {
    const bad = withWeek(month, week, (draft) => {
      draft.days[0].aerobic[0].intensity = "vigorous";
    });
    expect(check(bad).some((problem) => problem.startsWith(`week-${week + 1}:`))).toBe(true);
  });

  test("a Beginner's first week over 150 minutes is refused", () => {
    const bad = withWeek(month, 0, (draft) => {
      draft.days[0].aerobic[0].minutes = 151;
    });
    expect(check(bad)).toContain("week-1:beginner-first-week-aerobic");
  });

  test("an aerobic rise of more than 10% is refused", () => {
    const bad = withWeek(month, 1, (draft) => {
      draft.days[0].aerobic[0].minutes = 166;
    });
    expect(check(bad)).toContain("week-2:aerobic-increase");
  });

  test("any generated load rise is refused, even a small one", () => {
    const profile = testB;
    const loaded = validExerciseMonth(profile);
    const bad = structuredClone(loaded);
    for (const day of bad.weeks[1].days) {
      for (const item of day.strength) {
        if (item.exerciseKey === "goblet-squats-intermediate") item.loadKg = 6.3;
      }
    }
    const result = checkExerciseMonth(bad, {
      level: profile.fitnessLevel,
      catalog: EXERCISE_CATALOG,
    });
    expect(result.ok ? [] : result.problems).toContain("week-2:load-increase");
  });
});

describe("the menu checks", () => {
  const menu = validMenu(testB);
  const check = (input: Menu, goal = testB.goal, words = testB.wordsToAvoid) => {
    const result = checkMenuMonth(input, goal, words);
    return result.ok ? [] : result.problems;
  };

  test("six or eight days are refused", () => {
    expect(check({ ...menu, days: menu.days.slice(0, 6) })).toEqual(["wrong-day-count"]);
    expect(check({ ...menu, days: [...menu.days, { ...menu.days[0], day: 8 }] })).toEqual([
      "wrong-day-count",
    ]);
  });

  test("repeated day numbers are refused", () => {
    const repeated = structuredClone(menu);
    repeated.days[6].day = 1;
    expect(check(repeated)).toEqual(["wrong-day-numbers"]);
  });

  test.each([0, 3, 6])("a day under the minimum, on day %i, refuses the menu", (day) => {
    const low = structuredClone(menu);
    low.days[day].meals[0].calories = 299;
    expect(check(low)).toEqual(["calories-too-low"]);
  });

  test("a weight loss menu with no weekly loss is refused", () => {
    expect(check(validMenu(testB), "weight-loss", [])).toEqual(["weekly-loss-missing"]);
  });

  test("a weekly loss over the limit is refused", () => {
    expect(
      check({ ...validMenu(testA), expectedWeeklyLossKg: 0.91 }, "weight-loss", []),
    ).toEqual(["weekly-loss-too-high"]);
  });

  test.each([
    ["an ingredient", "Chicken thigh", "Stew"],
    ["a meal name", "Rice", "Chicken stew"],
    ["a longer word", "Shellfish mix", "Stew"],
    ["capital letters", "BACON", "Stew"],
    ["a plural", "Sardines", "Stew"],
  ])("a word to avoid in %s refuses the menu", (_name, ingredient, mealName) => {
    const bad = structuredClone(menu);
    bad.days[2].meals[1].name = mealName;
    bad.days[2].meals[1].ingredients[0].name = ingredient;
    expect(check(bad)).toEqual(["word-to-avoid"]);
  });

  test("accents don't hide a word to avoid", () => {
    const bad = structuredClone(menu);
    bad.days[0].meals[0].ingredients[0].name = "Sárdine";
    expect(findWordsToAvoid(bad, ["sardine"])).toEqual(["sardine"]);
  });

  test.each(["mixed nuts", "nut butter", "peanut", "groundnut", "satay"])(
    "test-a refuses %s",
    (word) => {
      const bad = structuredClone(validMenu(testA));
      bad.days[0].meals[0].ingredients[0].name = word;
      expect(check(bad, testA.goal, testA.wordsToAvoid)).toEqual(["word-to-avoid"]);
    },
  );
});

describe("the output format", () => {
  const month = validExerciseMonth(testA);

  test("a valid reply parses to the same shape", () => {
    expect(parseExerciseMonth(JSON.parse(JSON.stringify(month)))).toEqual(month);
  });

  test.each([
    ["not an object", 7],
    ["null", null],
    ["a list", []],
    ["a missing field", {}],
    ["an unknown top-level field", { weeks: [], extra: 1 }],
    [
      "an unknown day field",
      { weeks: [{ days: [{ day: 1, aerobic: [], strength: [], note: "x" }] }] },
    ],
    [
      "minutes as text",
      {
        weeks: [
          {
            days: [
              {
                day: 1,
                aerobic: [{ exerciseKey: "a", minutes: "30", intensity: "moderate" }],
                strength: [],
              },
            ],
          },
        ],
      },
    ],
    [
      "overlong text",
      {
        weeks: [
          {
            days: [
              {
                day: 1,
                aerobic: [
                  { exerciseKey: "a".repeat(61), minutes: 30, intensity: "moderate" },
                ],
                strength: [],
              },
            ],
          },
        ],
      },
    ],
    ["too many weeks to read", { weeks: Array(21).fill({ days: [] }) }],
  ])("%s is refused", (_name, input) => {
    expect(parseExerciseMonth(input)).toBeNull();
  });

  test("a valid menu parses, and drops an empty weekly loss", () => {
    const menu = validMenu(testB);
    expect(parseMenu(JSON.parse(menuReply(menu)))).toEqual(menu);
  });

  test.each([
    ["no weekly loss field", { days: [] }],
    ["an unknown field", { days: [], expectedWeeklyLossKg: null, extra: 1 }],
    [
      "an unknown meal field",
      {
        expectedWeeklyLossKg: null,
        days: [
          { day: 1, meals: [{ name: "A", calories: 1, ingredients: [], target: 1 }] },
        ],
      },
    ],
    [
      "an overlong portion",
      {
        expectedWeeklyLossKg: null,
        days: [
          {
            day: 1,
            meals: [
              {
                name: "A",
                calories: 1,
                ingredients: [{ name: "B", portion: "x".repeat(41) }],
              },
            ],
          },
        ],
      },
    ],
    [
      "an empty meal name",
      {
        expectedWeeklyLossKg: null,
        days: [{ day: 1, meals: [{ name: " ", calories: 1, ingredients: [] }] }],
      },
    ],
  ])("%s is refused", (_name, input) => {
    expect(parseMenu(input)).toBeNull();
  });
});

describe("generating a month", () => {
  test.each(TEST_PROFILES)("a valid reply for $key gives a plan", async (profile) => {
    const { provider, requests } = fakeProvider(validReplies(profile));

    const result = await generateMonthPlan(profile.key, provider);

    expect(result.ok).toBe(true);
    expect(requests).toHaveLength(2);
  });

  test("an unknown key sends nothing", async () => {
    const { provider, requests } = fakeProvider([]);

    expect(await generateMonthPlan("test-z", provider)).toEqual({
      ok: false,
      reason: "unknown-profile",
    });
    expect(requests).toHaveLength(0);
  });

  test.each([
    ["bad JSON", ["{not json"], "format", 1],
    ["an empty reply", [""], "format", 1],
    ["unknown fields", [JSON.stringify({ weeks: [], extra: 1 })], "format", 1],
    ["a network failure", [new Error("network")], "provider", 1],
  ])("%s refuses after one attempt", async (_name, replies, reason, calls) => {
    const { provider, requests } = fakeProvider(replies as (string | Error)[]);

    expect(await generateMonthPlan(testA.key, provider)).toEqual({ ok: false, reason });
    expect(requests).toHaveLength(calls as number);
  });

  test("a failed exercise limit refuses, and doesn't spend a menu request", async () => {
    const bad = withWeek(validExerciseMonth(testA), 3, (draft) => {
      draft.days[0].aerobic[0].minutes = 400;
    });
    const { provider, requests } = fakeProvider([JSON.stringify(bad)]);

    expect(await generateMonthPlan(testA.key, provider)).toEqual({
      ok: false,
      reason: "limits",
    });
    expect(requests).toHaveLength(1);
  });

  test.each([
    ["a bad menu", "{not json", "format"],
    ["a menu in the wrong shape", JSON.stringify({ days: [] }), "format"],
    [
      "a menu under the minimum",
      menuReply({
        ...validMenu(testA),
        days: validMenu(testA).days.map((day) => ({
          ...day,
          meals: day.meals.slice(0, 1),
        })),
      }),
      "limits",
    ],
  ])("%s refuses the whole month", async (_name, menu, reason) => {
    const { provider, requests } = fakeProvider([
      JSON.stringify(validExerciseMonth(testA)),
      menu,
    ]);

    expect(await generateMonthPlan(testA.key, provider)).toEqual({ ok: false, reason });
    expect(requests).toHaveLength(2);
  });

  test("a word to avoid in the menu refuses the whole month", async () => {
    const menu = structuredClone(validMenu(testA));
    menu.days[4].meals[0].ingredients[0].name = "Peanut sauce";
    const { provider } = fakeProvider([
      JSON.stringify(validExerciseMonth(testA)),
      menuReply(menu),
    ]);

    expect(await generateMonthPlan(testA.key, provider)).toEqual({
      ok: false,
      reason: "limits",
    });
  });

  test("a request that never answers counts as busy, with no retry", async () => {
    vi.useFakeTimers();
    const signals: AbortSignal[] = [];
    let calls = 0;
    const provider = {
      generate: ({ signal }: { signal: AbortSignal }) => {
        calls++;
        signals.push(signal);
        return new Promise<string>(() => undefined);
      },
    };

    const pending = generateMonthPlan(testA.key, provider);
    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);

    expect(await pending).toEqual({ ok: false, reason: "busy" });
    await vi.advanceTimersByTimeAsync(RETRY_WAIT_MS * 3);
    expect(calls).toBe(1);
    expect(signals[0].aborted).toBe(true);
  });

  test("Gemini timing out on its side (504) counts as busy, with no retry", async () => {
    const { provider, requests } = fakeProvider([httpError(504)]);

    expect(await generateMonthPlan(testA.key, provider)).toEqual({
      ok: false,
      reason: "busy",
    });
    expect(requests).toHaveLength(1);
  });

  describe("when Gemini is overloaded (503)", () => {
    const overloaded = () => httpError(503);

    /** Runs a build to the end, moving the clock through any waits. */
    async function run(provider: AiProvider) {
      vi.useFakeTimers();
      const pending = generateMonthPlan(testA.key, provider);
      await vi.advanceTimersByTimeAsync(RETRY_WAIT_MS * 3);
      return pending;
    }

    test("the retry settings are what the project owner asked for", () => {
      expect(MAX_RETRIES_PER_BUILD).toBe(2);
      expect(RETRY_WAIT_MS).toBeGreaterThanOrEqual(10_000);
    });

    test("one 503 is retried, and the build can still succeed", async () => {
      const [exercise, menu] = validReplies(testA);
      const { provider, requests } = fakeProvider([overloaded(), exercise, menu]);

      expect((await run(provider)).ok).toBe(true);
      expect(requests).toHaveLength(3);
    });

    test("two 503s are retried, and the build can still succeed", async () => {
      const [exercise, menu] = validReplies(testA);
      const { provider, requests } = fakeProvider([
        overloaded(),
        overloaded(),
        exercise,
        menu,
      ]);

      expect((await run(provider)).ok).toBe(true);
      expect(requests).toHaveLength(4);
    });

    test("a third 503 stops, after exactly two retries", async () => {
      const { provider, requests } = fakeProvider([
        overloaded(),
        overloaded(),
        overloaded(),
        overloaded(),
      ]);

      expect(await run(provider)).toEqual({ ok: false, reason: "busy" });
      expect(requests).toHaveLength(3);
    });

    test("the two retries are shared across the whole build", async () => {
      const [exercise] = validReplies(testA);
      const { provider, requests } = fakeProvider([
        overloaded(),
        overloaded(),
        exercise,
        overloaded(),
        overloaded(),
      ]);

      expect(await run(provider)).toEqual({ ok: false, reason: "busy" });
      expect(requests).toHaveLength(4);
    });

    test("a menu request can also be retried", async () => {
      const [exercise, menu] = validReplies(testA);
      const { provider, requests } = fakeProvider([exercise, overloaded(), menu]);

      expect((await run(provider)).ok).toBe(true);
      expect(requests).toHaveLength(3);
    });

    test("it waits between attempts, and doesn't send early", async () => {
      vi.useFakeTimers();
      const [exercise, menu] = validReplies(testA);
      const { provider, requests } = fakeProvider([overloaded(), exercise, menu]);

      const pending = generateMonthPlan(testA.key, provider);
      await vi.advanceTimersByTimeAsync(RETRY_WAIT_MS - 1);
      expect(requests).toHaveLength(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(requests).toHaveLength(3);
      expect((await pending).ok).toBe(true);
    });

    test("a retry that then fails a safety rule stops, with no more retries", async () => {
      const bad = validExerciseMonth(testA);
      bad.weeks[3].days[0].aerobic[0].minutes = 400;
      const { provider, requests } = fakeProvider([
        overloaded(),
        JSON.stringify(bad),
        JSON.stringify(validExerciseMonth(testA)),
      ]);

      expect(await run(provider)).toEqual({ ok: false, reason: "limits" });
      expect(requests).toHaveLength(2);
    });

    test("a 503 logs nothing", async () => {
      const spies = (["log", "info", "warn", "error", "debug"] as const).map((level) =>
        vi.spyOn(console, level).mockImplementation(() => undefined),
      );

      await run(fakeProvider([overloaded(), overloaded(), overloaded()]).provider);

      for (const spy of spies) expect(spy).not.toHaveBeenCalled();
    });
  });

  describe("nothing else is retried", () => {
    test.each([400, 401, 403, 404, 429, 500, 502])(
      "HTTP %i is refused after one attempt",
      async (status) => {
        vi.useFakeTimers();
        const { provider, requests } = fakeProvider([httpError(status)]);

        const pending = generateMonthPlan(testA.key, provider);
        await vi.advanceTimersByTimeAsync(RETRY_WAIT_MS * 3);

        expect(await pending).toEqual({ ok: false, reason: "provider" });
        expect(requests).toHaveLength(1);
      },
    );

    test("a failed safety rule is refused after one attempt, and waits for nothing", async () => {
      const bad = validExerciseMonth(testA);
      bad.weeks[0].days[0].aerobic[0].minutes = 151;
      const { provider, requests } = fakeProvider([JSON.stringify(bad)]);

      expect(await generateMonthPlan(testA.key, provider)).toEqual({
        ok: false,
        reason: "limits",
      });
      expect(requests).toHaveLength(1);
    });
  });

  test("a failure logs nothing", async () => {
    const spies = (["log", "info", "warn", "error", "debug"] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => undefined),
    );

    const { provider } = fakeProvider([new Error("secret detail")]);
    await generateMonthPlan(testA.key, provider);
    const invalid = fakeProvider(["{not json"]);
    await generateMonthPlan(testA.key, invalid.provider);

    for (const spy of spies) expect(spy).not.toHaveBeenCalled();
  });
});

describe("what is sent", () => {
  async function capture(key: string) {
    const profile = findTestProfile(key);
    if (!profile) throw new Error("unknown test profile");
    const { provider, requests } = fakeProvider(validReplies(profile));
    await generateMonthPlan(key, provider);
    return { profile, requests };
  }

  /** The details object in a prompt, read back out of its text. */
  function sentDetails(prompt: string): Record<string, unknown> {
    const line = prompt.split("\n").find((part) => part.startsWith("Made-up person: "));
    return JSON.parse((line as string).replace("Made-up person: ", ""));
  }

  function hasOnlyApprovedFields(details: Record<string, unknown>): boolean {
    return (
      Object.keys(details).sort().join() ===
      [
        "age",
        "allergies",
        "dietaryRestrictions",
        "fitnessLevel",
        "goal",
        "heightCm",
        "weightKg",
      ].join()
    );
  }

  test("the field check catches a planted extra field", () => {
    expect(hasOnlyApprovedFields({ email: "x" })).toBe(false);
    expect(
      hasOnlyApprovedFields({
        age: 1,
        allergies: [],
        dietaryRestrictions: [],
        fitnessLevel: "a",
        goal: "b",
        heightCm: 1,
        weightKg: 1,
        email: "x",
      }),
    ).toBe(false);
  });

  test.each(TEST_PROFILES)(
    "both requests for $key hold only approved fields, with built-in values",
    async ({ key }) => {
      const { profile, requests } = await capture(key);

      expect(requests).toHaveLength(2);
      for (const { prompt } of requests) {
        const details = sentDetails(prompt);
        expect(hasOnlyApprovedFields(details)).toBe(true);
        expect(details).toEqual({
          age: profile.age,
          heightCm: profile.heightCm,
          weightKg: profile.weightKg,
          fitnessLevel: profile.fitnessLevel,
          goal: profile.goal,
          allergies: profile.allergies,
          dietaryRestrictions: profile.dietaryRestrictions,
        });
      }
    },
  );

  test("the words to avoid are never sent", async () => {
    const { requests } = await capture("test-b");
    for (const { prompt } of requests) {
      expect(prompt).not.toContain("wordsToAvoid");
      expect(prompt).not.toContain("prosciutto");
    }
  });
});

describe("the import boundary", () => {
  const FORBIDDEN =
    /(^|\/)(db\/|profiles$|plan-access$|auth-server$|auth$|accounts$|tracking$|test-plans$)|^next\/headers$|^better-auth|^drizzle-orm|^better-sqlite3/;

  type ReadSource = (path: string) => string | null;

  function resolve(from: string, name: string): string | null {
    if (name.startsWith("@/")) return join("src", name.slice(2));
    if (name.startsWith(".")) return join(dirname(from), name);
    return null;
  }

  function fromDisk(path: string): string | null {
    for (const candidate of [`${path}.ts`, `${path}.tsx`, path]) {
      if (candidate.match(/\.tsx?$/) && existsSync(candidate)) {
        return readFileSync(candidate, "utf8");
      }
    }
    return null;
  }

  /** Follows every import from the entry files, and returns any forbidden one. */
  function forbiddenImports(entries: string[], read: ReadSource): string[] {
    const seen = new Set<string>();
    const found: string[] = [];
    const queue = [...entries];

    while (queue.length > 0) {
      const path = queue.pop() as string;
      if (seen.has(path)) continue;
      seen.add(path);

      const source = read(path);
      if (source === null) continue;

      for (const match of source.matchAll(/(?:from|import)\s+"([^"]+)"/g)) {
        const name = match[1];
        const normalized = name.replace(/^@\//, "").replace(/\\/g, "/");
        if (FORBIDDEN.test(normalized)) found.push(`${path} -> ${name}`);
        const next = resolve(path, name);
        if (next) queue.push(next);
      }
    }
    return found;
  }

  const ENTRIES = [
    "src/lib/ai/generate-plan",
    "src/lib/ai/gemini-provider",
    "src/lib/ai/plan-format",
    "src/lib/ai/provider",
  ].map((path) => join(path));

  test("the check catches planted forbidden imports, directly and indirectly", () => {
    const files: Record<string, string> = {
      [join("a", "entry")]: 'import { x } from "./middle";',
      [join("a", "middle")]: 'import { y } from "@/lib/profiles";',
      [join("b", "entry")]: 'import { z } from "@/db/database";',
      [join("c", "entry")]: 'import { headers } from "next/headers";',
      [join("d", "entry")]: 'import { fine } from "./fine";',
      [join("d", "fine")]: 'export const fine = 1;',
    };
    const read = (path: string) => files[path] ?? null;

    expect(forbiddenImports([join("a", "entry")], read)).toHaveLength(1);
    expect(forbiddenImports([join("b", "entry")], read)).toHaveLength(1);
    expect(forbiddenImports([join("c", "entry")], read)).toHaveLength(1);
    expect(forbiddenImports([join("d", "entry")], read)).toEqual([]);
  });

  test("the entry files exist, so the check is really reading them", () => {
    for (const entry of ENTRIES) expect(fromDisk(entry)).not.toBeNull();
  });

  test("generation and provider code can't reach saved data", () => {
    expect(forbiddenImports(ENTRIES, fromDisk)).toEqual([]);
  });

  test("the functions that generate take a key, not profile values", () => {
    expect(generateMonthPlan.length).toBe(2);
    const source = readFileSync("src/lib/ai/generate-plan.ts", "utf8");
    expect(source).toContain("testProfileKey: string,\n  provider: AiProvider,");
  });

  test("no browser code imports the AI provider", () => {
    const pages = [
      "src/app/test-plans/build-form.tsx",
      "src/app/test-plans/start-over.tsx",
    ];
    for (const page of pages) {
      const source = readFileSync(page, "utf8");
      expect(source).toContain('"use client"');
      expect(source).not.toMatch(/lib\/ai\/|@google\/genai/);
    }
  });
});

describe("the provider setup", () => {
  test("no key means no provider, so nothing is sent", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_MODEL", "some-model");
    const { getAiProvider } = await import("./gemini-provider");
    expect(getAiProvider()).toBeNull();
    vi.unstubAllEnvs();
  });

  test("no model means no provider", async () => {
    vi.stubEnv("GEMINI_API_KEY", "not-a-real-key");
    vi.stubEnv("GEMINI_MODEL", "");
    const { getAiProvider } = await import("./gemini-provider");
    expect(getAiProvider()).toBeNull();
    vi.unstubAllEnvs();
  });
});
