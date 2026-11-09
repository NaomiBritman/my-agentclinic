import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

import { profile as profileTable, testPlan, user } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { signUp } from "@/lib/accounts";
import {
  fakeProvider,
  httpError,
  menuReply,
  validExerciseMonth,
  validMenu,
  validReplies,
} from "@/lib/ai/fixtures";
import {
  REQUEST_TIMEOUT_MS,
  RETRY_WAIT_MS,
  type AiProvider,
} from "@/lib/ai/provider";
import { getAuth } from "@/lib/auth-server";
import { saveProfile } from "@/lib/profiles";
import type { ProfileValues } from "@/lib/profile-validation";
import { findTestProfile, TEST_PROFILES } from "@/lib/test-mode/test-profiles";
import { getActivePlan, saveActivePlan } from "@/lib/test-plans";
import { WORDING } from "@/lib/wording";

import { buildPlanAction, startOverAction } from "./actions";

const { requestHeaders, currentProvider } = vi.hoisted(() => ({
  requestHeaders: { current: new Headers() },
  currentProvider: { current: null as unknown },
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
}));
vi.mock("@/db/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/database")>();
  return { ...actual, getDatabase: () => testDatabase.db };
});
vi.mock("@/lib/ai/gemini-provider", () => ({
  getAiProvider: () => currentProvider.current,
}));

const testDatabase = createTestDatabase();

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-only-used-by-these-tests");
vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");

const PASSWORD = "not-a-real-password";
const testA = TEST_PROFILES[0];
const testB = TEST_PROFILES[1];

// Deliberately unrealistic values, with a BMI far above the weight loss limit.
const ELIGIBLE: ProfileValues = {
  age: 18,
  heightCm: 1,
  weightKg: 1,
  fitnessLevel: "beginner",
  goal: "toning",
  eatingDisorderAnswer: "no",
  medicalConditionAnswer: "no",
};

async function createAccount(email: string, values: ProfileValues | null = ELIGIBLE) {
  const auth = getAuth();
  await signUp(auth, { email, password: PASSWORD }, new Headers());
  const { headers, response } = await auth.api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  });
  if (values) saveProfile(testDatabase.db, response.user.id, values);
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]);
  return {
    id: response.user.id,
    headers: new Headers({ cookie: cookie.join("; ") }),
  };
}

async function loggedIn(email = "a@example.com", values: ProfileValues | null = ELIGIBLE) {
  const account = await createAccount(email, values);
  requestHeaders.current = account.headers;
  return account;
}

function build(key: string = testA.key, extra: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("testProfileKey", key);
  for (const [name, value] of Object.entries(extra)) formData.set(name, value);
  return buildPlanAction({ message: null }, formData);
}

function useProvider(replies: (string | Error)[]) {
  const fake = fakeProvider(replies);
  currentProvider.current = fake.provider;
  return fake;
}

function savedPlans() {
  return testDatabase.db.select().from(testPlan).all();
}

beforeEach(() => {
  testDatabase.db.delete(user).run();
  requestHeaders.current = new Headers();
  currentProvider.current = null;
});

afterAll(() => {
  testDatabase.cleanup();
});

describe("building", () => {
  test("a valid month saves and goes to the plan", async () => {
    const account = await loggedIn();
    useProvider(validReplies(testA));

    await expect(build()).rejects.toThrow("redirect:/test-plans");

    const plan = getActivePlan(testDatabase.db, account.id);
    expect(plan?.testProfileKey).toBe(testA.key);
    expect(plan?.exercise.weeks).toHaveLength(4);
    expect(plan?.menu.days).toHaveLength(7);
  });

  test("the plan starts today, ignoring any date in the form", async () => {
    const account = await loggedIn();
    useProvider(validReplies(testA));

    await expect(build(testA.key, { startDate: "2000-01-01" })).rejects.toThrow("redirect:");

    expect(getActivePlan(testDatabase.db, account.id)?.startDate).not.toBe("2000-01-01");
  });

  test.each([
    ["no key set up", () => null],
    ["a network failure", () => fakeProvider([new Error("network")]).provider],
    ["an invalid key (400)", () => fakeProvider([httpError(400)]).provider],
    ["a permission error (403)", () => fakeProvider([httpError(403)]).provider],
    ["a model not found (404)", () => fakeProvider([httpError(404)]).provider],
    ["a quota error (429)", () => fakeProvider([httpError(429)]).provider],
    ["a server error (500)", () => fakeProvider([httpError(500)]).provider],
    ["output that isn't JSON", () => fakeProvider(["{not json"]).provider],
    ["output in the wrong format", () => fakeProvider([JSON.stringify({ weeks: [], extra: 1 })]).provider],
  ])("%s shows only the couldn't be reached message, and saves nothing", async (_name, provider) => {
    await loggedIn();
    currentProvider.current = provider();

    expect(await build()).toEqual({ message: WORDING.testPlans.geminiUnreachable });
    expect(savedPlans()).toEqual([]);
  });

  test("a failed menu request also shows the couldn't be reached message", async () => {
    await loggedIn();
    const [exercise] = validReplies(testA);
    useProvider([exercise, httpError(429)]);

    expect(await build()).toEqual({ message: WORDING.testPlans.geminiUnreachable });
    expect(savedPlans()).toEqual([]);
  });

  test("the three failure messages are all different, and neutral", () => {
    const { noPlanProduced, geminiBusy, geminiUnreachable } = WORDING.testPlans;
    expect(new Set([noPlanProduced, geminiBusy, geminiUnreachable]).size).toBe(3);
    expect(geminiUnreachable).toBe(
      "Gemini couldn't be reached, so no plan was built. Please try again later.",
    );
    expect(geminiBusy).toBe(
      "Gemini is busy right now, so no plan was built. Please try again later.",
    );
    expect(geminiUnreachable).not.toMatch(/safety|limit/i);
  });

  test("a failed limit shows only the neutral message, and saves nothing", async () => {
    await loggedIn();
    const bad = validExerciseMonth(testA);
    bad.weeks[3].days[0].aerobic[0].minutes = 400;
    const { requests } = useProvider([JSON.stringify(bad)]);

    expect(await build()).toEqual({ message: WORDING.testPlans.noPlanProduced });
    expect(savedPlans()).toEqual([]);
    expect(requests).toHaveLength(1);
  });

  describe("when Gemini is busy", () => {
    /** Runs a build to the end, moving the clock through any retry waits. */
    async function buildThroughWaits() {
      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      try {
        let finished = false;
        const settled = build().then(
          (value) => ({ value }),
          (error: Error) => ({ error }),
        );
        void settled.finally(() => {
          finished = true;
        });
        // The action reads the session first, so waits can start at any point.
        while (!finished) {
          await new Promise((resolve) => setImmediate(resolve));
          await vi.advanceTimersByTimeAsync(RETRY_WAIT_MS);
        }
        return await settled;
      } finally {
        vi.useRealTimers();
      }
    }

    test("repeated 503s show the busy message, not the safety message", async () => {
      await loggedIn();
      const { requests } = useProvider([httpError(503), httpError(503), httpError(503)]);

      expect(await buildThroughWaits()).toEqual({
        value: { message: WORDING.testPlans.geminiBusy },
      });
      expect(requests).toHaveLength(3);
      expect(savedPlans()).toEqual([]);
    });

    test("a request that times out shows the busy message", async () => {
      await loggedIn();
      let calls = 0;
      currentProvider.current = {
        generate: () => {
          calls++;
          return new Promise<string>(() => undefined);
        },
      } satisfies AiProvider;

      vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
      try {
        const pending = build();
        await vi.waitFor(() => expect(calls).toBe(1));
        await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS);
        expect(await pending).toEqual({ message: WORDING.testPlans.geminiBusy });
      } finally {
        vi.useRealTimers();
      }
      expect(calls).toBe(1);
      expect(savedPlans()).toEqual([]);
    });

    test("a 503 that clears within the retries still builds the plan", async () => {
      const account = await loggedIn();
      const [exercise, menu] = validReplies(testA);
      const { requests } = useProvider([httpError(503), exercise, menu]);

      const outcome = await buildThroughWaits();

      expect("error" in outcome && outcome.error.message).toBe("redirect:/test-plans");
      expect(requests).toHaveLength(3);
      expect(getActivePlan(testDatabase.db, account.id)).not.toBeNull();
    });

    test("a build can be pressed again afterward", async () => {
      await loggedIn();
      useProvider([httpError(503), httpError(503), httpError(503)]);
      await buildThroughWaits();

      useProvider(validReplies(testA));
      await expect(build()).rejects.toThrow("redirect:/test-plans");
    });

    test("the busy message is neutral, and different from the safety message", () => {
      expect(WORDING.testPlans.geminiBusy).not.toBe(WORDING.testPlans.noPlanProduced);
      expect(WORDING.testPlans.geminiBusy).toContain("busy");
      expect(WORDING.testPlans.geminiBusy).toContain("try again later");
      expect(WORDING.testPlans.geminiBusy).not.toMatch(/safety|limit/i);
    });
  });

  test.each([
    [
      "an exercise limit",
      () => {
        const bad = validExerciseMonth(testA);
        bad.weeks[3].days[0].aerobic[0].minutes = 400;
        return [JSON.stringify(bad)];
      },
    ],
    [
      "the calorie minimum",
      () => {
        const menu = validMenu(testA);
        menu.days[2].meals = menu.days[2].meals.slice(0, 1);
        return [validReplies(testA)[0], menuReply(menu)];
      },
    ],
    [
      "the weekly loss limit",
      () => [
        validReplies(testA)[0],
        menuReply({ ...validMenu(testA), expectedWeeklyLossKg: 0.91 }),
      ],
    ],
    [
      "a word to avoid",
      () => {
        const menu = validMenu(testA);
        menu.days[0].meals[0].ingredients[0].name = "Peanut sauce";
        return [validReplies(testA)[0], menuReply(menu)];
      },
    ],
  ])("a failed safety rule, %s, shows the safety limits message", async (_name, replies) => {
    await loggedIn();
    useProvider(replies());

    expect(await build()).toEqual({ message: WORDING.testPlans.noPlanProduced });
    expect(savedPlans()).toEqual([]);
  });

  test("an unknown test profile sends nothing", async () => {
    await loggedIn();
    const { requests } = useProvider([]);

    expect(await build("test-z")).toEqual({ message: null });
    expect(requests).toEqual([]);
  });

  test("a second build is refused while one is running", async () => {
    await loggedIn();
    let release: (value: string) => void = () => undefined;
    let calls = 0;
    const replies = validReplies(testA);
    const provider: AiProvider = {
      generate: () => {
        calls++;
        if (calls === 1) {
          return new Promise<string>((resolve) => {
            release = resolve;
          });
        }
        return Promise.resolve(replies[1]);
      },
    };
    currentProvider.current = provider;

    const first = build();
    await vi.waitFor(() => expect(calls).toBe(1));

    expect(await build()).toEqual({ message: null });
    expect(calls).toBe(1);

    release(replies[0]);
    await expect(first).rejects.toThrow("redirect:/test-plans");
    expect(calls).toBe(2);
  });

  test("building again is possible after a failure", async () => {
    const account = await loggedIn();
    useProvider(["{not json"]);
    await build();

    useProvider(validReplies(testA));
    await expect(build()).rejects.toThrow("redirect:/test-plans");

    expect(getActivePlan(testDatabase.db, account.id)).not.toBeNull();
  });

  test("an existing plan isn't replaced without starting over", async () => {
    const account = await loggedIn();
    useProvider(validReplies(testA));
    await expect(build()).rejects.toThrow("redirect:");

    const { requests } = useProvider(validReplies(testB));
    await expect(build(testB.key)).rejects.toThrow("redirect:/test-plans");

    expect(requests).toEqual([]);
    expect(getActivePlan(testDatabase.db, account.id)?.testProfileKey).toBe(testA.key);
  });
});

describe("access", () => {
  test("a logged-out visitor can't build or start over", async () => {
    const { requests } = useProvider([]);

    await expect(build()).rejects.toThrow("redirect:/log-in");
    await expect(startOverAction()).rejects.toThrow("redirect:/log-in");
    expect(requests).toEqual([]);
  });

  test("a person with no saved profile is sent to the form", async () => {
    await loggedIn("a@example.com", null);
    const { requests } = useProvider([]);

    await expect(build()).rejects.toThrow("redirect:/profile");
    expect(requests).toEqual([]);
  });

  test("unanswered questions send the person to answer them", async () => {
    const account = await loggedIn();
    testDatabase.db
      .update(profileTable)
      .set({ eatingDisorderAnswer: null, medicalConditionAnswer: null })
      .where(eq(profileTable.userId, account.id))
      .run();
    const { requests } = useProvider([]);

    await expect(build()).rejects.toThrow("redirect:/profile");
    expect(requests).toEqual([]);
  });

  test.each(["eatingDisorderAnswer", "medicalConditionAnswer"] as const)(
    "a yes to %s can't build, or remove a stored plan",
    async (answer) => {
      const account = await loggedIn();
      saveActivePlan(
        testDatabase.db,
        account.id,
        {
          testProfileKey: testA.key,
          exercise: validExerciseMonth(testA),
          menu: { days: [] },
        },
        "2026-03-10",
      );
      saveProfile(testDatabase.db, account.id, { ...ELIGIBLE, [answer]: "yes" });
      const { requests } = useProvider(validReplies(testB));

      expect(await build(testB.key)).toEqual({ message: null });
      await expect(startOverAction()).rejects.toThrow("redirect:/test-plans");

      expect(requests).toEqual([]);
      expect(savedPlans()).toHaveLength(1);
    },
  );

  describe("with a BMI under 18.5", () => {
    const LOW_BMI: ProfileValues = { ...ELIGIBLE, heightCm: 100, weightKg: 18.49 };

    test("the weight loss test profile can't be built", async () => {
      await loggedIn("a@example.com", LOW_BMI);
      const { requests } = useProvider(validReplies(testA));

      expect(await build(testA.key)).toEqual({ message: null });
      expect(requests).toEqual([]);
      expect(savedPlans()).toEqual([]);
    });

    test("the other test profiles still can", async () => {
      const account = await loggedIn("a@example.com", LOW_BMI);
      useProvider(validReplies(testB));

      await expect(build(testB.key)).rejects.toThrow("redirect:/test-plans");

      expect(getActivePlan(testDatabase.db, account.id)?.testProfileKey).toBe(testB.key);
    });
  });
});

describe("start over", () => {
  test("removes the plan, so another can be built", async () => {
    const account = await loggedIn();
    useProvider(validReplies(testA));
    await expect(build()).rejects.toThrow("redirect:");

    await expect(startOverAction()).rejects.toThrow("redirect:/test-plans");
    expect(getActivePlan(testDatabase.db, account.id)).toBeNull();

    useProvider(validReplies(testB));
    await expect(build(testB.key)).rejects.toThrow("redirect:/test-plans");
    expect(getActivePlan(testDatabase.db, account.id)?.testProfileKey).toBe(testB.key);
  });

  test("removes only this account's plan", async () => {
    const accountA = await loggedIn("a@example.com");
    useProvider(validReplies(testA));
    await expect(build()).rejects.toThrow("redirect:");

    const accountB = await loggedIn("b@example.com");
    useProvider(validReplies(testB));
    await expect(build(testB.key)).rejects.toThrow("redirect:");

    await expect(startOverAction()).rejects.toThrow("redirect:");

    expect(getActivePlan(testDatabase.db, accountB.id)).toBeNull();
    expect(getActivePlan(testDatabase.db, accountA.id)?.testProfileKey).toBe(testA.key);
  });
});

describe("data separation", () => {
  test("naming another account in the form changes nothing of theirs", async () => {
    const accountA = await loggedIn("a@example.com");
    useProvider(validReplies(testA));
    await expect(build()).rejects.toThrow("redirect:");

    const accountB = await loggedIn("b@example.com");
    useProvider(validReplies(testB));
    await expect(
      build(testB.key, { userId: accountA.id, accountId: accountA.id }),
    ).rejects.toThrow("redirect:");

    expect(getActivePlan(testDatabase.db, accountA.id)?.testProfileKey).toBe(testA.key);
    expect(getActivePlan(testDatabase.db, accountB.id)?.testProfileKey).toBe(testB.key);
  });

  test("deleting an account deletes its plan", async () => {
    const account = await loggedIn();
    useProvider(validReplies(testA));
    await expect(build()).rejects.toThrow("redirect:");

    testDatabase.db.delete(user).where(eq(user.id, account.id)).run();

    expect(savedPlans()).toEqual([]);
  });
});

describe("saved details never reach the provider", () => {
  // Unique markers that would be obvious in a request, with a BMI that leaves
  // every test profile available.
  const MARKERS: ProfileValues = {
    age: 987,
    heightCm: 65.4321,
    weightKg: 123.456,
    fitnessLevel: "experienced",
    goal: "muscle-building",
    eatingDisorderAnswer: "no",
    medicalConditionAnswer: "no",
  };
  const EMAIL = "marker-address-xyz@example.com";

  function leaks(requestText: string, accountId: string): string[] {
    return [
      "987",
      "65.4321",
      "123.456",
      EMAIL,
      accountId,
      "eatingDisorderAnswer",
      "medicalConditionAnswer",
      "disorder",
    ].filter((marker) => requestText.includes(marker));
  }

  test("the check catches planted leaks", () => {
    expect(leaks(`{"weight":123.456}`, "id-1")).toEqual(["123.456"]);
    expect(leaks(`hello ${EMAIL} id-1`, "id-1")).toEqual([EMAIL, "id-1"]);
    expect(leaks(`{"eatingDisorderAnswer":"no"}`, "id-1")).toContain(
      "eatingDisorderAnswer",
    );
  });

  test.each(TEST_PROFILES)(
    "building $key sends none of the account's saved details",
    async ({ key }) => {
      const account = await loggedIn(EMAIL, MARKERS);
      const profile = findTestProfile(key);
      if (!profile) throw new Error("unknown test profile");
      const { requests } = useProvider(validReplies(profile));

      await expect(build(key)).rejects.toThrow("redirect:/test-plans");

      expect(requests).toHaveLength(2);
      for (const { prompt, schema } of requests) {
        expect(leaks(prompt + JSON.stringify(schema), account.id)).toEqual([]);
        expect(prompt).toContain(JSON.stringify(profile.age));
      }
    },
  );

  test("a person's own goal doesn't choose the test profile sent", async () => {
    await loggedIn(EMAIL, MARKERS);
    const { requests } = useProvider(validReplies(testA));

    await expect(build(testA.key)).rejects.toThrow("redirect:");

    expect(requests[0].prompt).toContain('"goal":"weight-loss"');
    expect(requests[0].prompt).not.toContain('"goal":"muscle-building"');
  });
});
