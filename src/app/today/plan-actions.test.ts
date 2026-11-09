import { afterAll, afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { planLoadMark, trackingMark, user } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { signUp } from "@/lib/accounts";
import { validExerciseMonth, validMenu } from "@/lib/ai/fixtures";
import { getAuth } from "@/lib/auth-server";
import { addDays } from "@/lib/dates";
import { buildPlanDay, type PlanExerciseItem } from "@/lib/plan-days";
import { getPlanProgress, getTodayPlanState } from "@/lib/plan-tracking";
import type { ProfileValues } from "@/lib/profile-validation";
import { saveProfile } from "@/lib/profiles";
import { TEST_PROFILES, type TestProfile } from "@/lib/test-mode/test-profiles";
import { getActivePlan, saveActivePlan } from "@/lib/test-plans";
import { getDayMarks, getHistory } from "@/lib/tracking";

import { startOverAction } from "../test-plans/actions";

import { setMarkAction } from "./actions";
import { setLoadMarkAction, setPlanMarkAction } from "./plan-actions";

const { requestHeaders } = vi.hoisted(() => ({
  requestHeaders: { current: new Headers() },
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
vi.mock("next/cache", () => ({ refresh: vi.fn() }));
vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
  cookies: async () => ({ get: () => undefined, set: () => undefined }),
}));
vi.mock("@/db/database", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/db/database")>();
  return { ...actual, getDatabase: () => testDatabase.db };
});
vi.mock("@/lib/ai/gemini-provider", () => ({ getAiProvider: () => null }));

const testDatabase = createTestDatabase();

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-only-used-by-these-tests");
vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");

const { db } = testDatabase;
const PASSWORD = "not-a-real-password";
const START = "2026-03-02";
const [testA, testB] = TEST_PROFILES;
const LOADED = "goblet-squats-intermediate";

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

const dateOfDay = (day: number) => addDays(START, day - 1);

function setClock(date: string) {
  vi.setSystemTime(new Date(`${date}T12:00:00`));
}

/** Sessions expire, so this logs in afresh on whatever date the clock shows. */
async function logIn(email: string) {
  const { headers } = await getAuth().api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  });
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]);
  requestHeaders.current = new Headers({ cookie: cookie.join("; ") });
}

async function createAccount(email: string, profile: TestProfile | null = testB) {
  const { user: created } = await signUp(
    getAuth(),
    { email, password: PASSWORD },
    new Headers(),
  ).then(async () =>
    getAuth().api.signInEmail({ body: { email, password: PASSWORD } }),
  );
  saveProfile(db, created.id, ELIGIBLE);
  if (profile) {
    saveActivePlan(
      db,
      created.id,
      {
        testProfileKey: profile.key,
        exercise: validExerciseMonth(profile),
        menu: validMenu(profile),
      },
      START,
    );
  }
  await logIn(email);
  return created.id;
}

/** The day as the site works it out right now, for finding real item keys. */
function today(accountId: string, date: string) {
  const state = getTodayPlanState(db, accountId, date);
  if (state.kind !== "plan" || state.position.status !== "active") {
    throw new Error(`no active plan day: ${state.kind}`);
  }
  return buildPlanDay({
    planId: state.plan.id,
    startDate: state.plan.startDate,
    weeks: state.weeks,
    menu: state.plan.menu,
    day: state.position.day,
  });
}

function exerciseOf(accountId: string, date: string, key: string): PlanExerciseItem {
  const item = today(accountId, date).exercises.find(
    (exercise) => exercise.exerciseKey === key,
  );
  if (!item) throw new Error("exercise not on this day");
  return item;
}

const allMarks = () => db.select().from(trackingMark).all();
const allLoadMarks = () => db.select().from(planLoadMark).all();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  setClock(START);
  db.delete(user).run();
  requestHeaders.current = new Headers();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  testDatabase.cleanup();
});

describe("ticks", () => {
  test("ticking saves for today with the item's name, and unticking removes it", async () => {
    const id = await createAccount("a@example.com");
    const item = today(id, START).exercises[0];

    await setPlanMarkAction(item.key, true);
    expect(allMarks()).toMatchObject([
      { date: START, itemType: "exercise", itemKey: item.key, itemName: "Brisk walking" },
    ]);

    await setPlanMarkAction(item.key, false);
    expect(allMarks()).toEqual([]);
  });

  test("meals can be ticked", async () => {
    const id = await createAccount("a@example.com");
    const meal = today(id, START).meals[0];

    await setPlanMarkAction(meal.key, true);

    expect(getDayMarks(db, id, START).meals.has(meal.key)).toBe(true);
    expect(allMarks()).toMatchObject([{ itemType: "meal", itemName: "Morning oats" }]);
  });

  test("ticks are saved per day, and the next day starts clear", async () => {
    const id = await createAccount("a@example.com");
    await setPlanMarkAction(today(id, START).exercises[0].key, true);

    setClock(dateOfDay(2));
    await logIn("a@example.com");

    expect(getDayMarks(db, id, dateOfDay(2)).exercises.size).toBe(0);
    expect(getDayMarks(db, id, START).exercises.size).toBe(1);
  });

  test.each([
    ["an unknown key", "plan:made-up:strength:0", true],
    ["a sample key", "walking", true],
    ["a number", 7, true],
    ["a value that isn't true or false", null, "yes"],
  ])("%s saves nothing", async (_name, key, marked) => {
    const id = await createAccount("a@example.com");
    const realKey = today(id, START).exercises[0].key;

    await setPlanMarkAction(key ?? realKey, marked);

    expect(allMarks()).toEqual([]);
  });

  test("an item that isn't on today's plan can't be ticked", async () => {
    const id = await createAccount("a@example.com");
    const strengthKey = today(id, START).exercises[1].key;

    // Day four of a three-day week is a rest day, so nothing is scheduled.
    setClock(dateOfDay(4));
    await logIn("a@example.com");
    await setPlanMarkAction(strengthKey, true);

    expect(today(id, dateOfDay(4)).exercises).toEqual([]);
    expect(allMarks()).toEqual([]);
  });

  test("a date from the browser is ignored", async () => {
    const id = await createAccount("a@example.com");
    const item = today(id, START).exercises[0];

    const sendWithDate = setPlanMarkAction as unknown as (
      ...args: unknown[]
    ) => Promise<void>;
    await sendWithDate(item.key, true, dateOfDay(5));

    expect(allMarks().map((mark) => mark.date)).toEqual([START]);
  });

  test("past or future days can't be ticked, because only today exists on the server", async () => {
    const id = await createAccount("a@example.com");
    const day1Key = today(id, START).exercises[1].key;

    setClock(dateOfDay(2));
    await logIn("a@example.com");
    await setPlanMarkAction(day1Key, true);

    expect(allMarks().map((mark) => mark.date)).toEqual([dateOfDay(2)]);
  });

  test("before the start date, nothing can be ticked", async () => {
    const id = await createAccount("a@example.com");
    const key = today(id, START).exercises[0].key;

    setClock(addDays(START, -1));
    await logIn("a@example.com");
    await setPlanMarkAction(key, true);

    expect(allMarks()).toEqual([]);
  });

  test("after day 28, the plan ended and nothing more can be ticked", async () => {
    const id = await createAccount("a@example.com");
    const key = today(id, START).exercises[0].key;

    setClock(dateOfDay(29));
    await logIn("a@example.com");
    await setPlanMarkAction(key, true);

    expect(allMarks()).toEqual([]);
    expect(getTodayPlanState(db, id, dateOfDay(29))).toMatchObject({
      kind: "plan",
      position: { status: "ended" },
    });
  });

  test("a logged-out visitor can't tick or mark", async () => {
    await expect(setPlanMarkAction("x", true)).rejects.toThrow("redirect:/log-in");
    await expect(setLoadMarkAction("x", true)).rejects.toThrow("redirect:/log-in");
  });
});

describe("what /today may show", () => {
  test("no plan yet means choosing one", async () => {
    const id = await createAccount("a@example.com", null);
    expect(getTodayPlanState(db, id, START)).toEqual({ kind: "choose" });
  });

  test("unanswered questions mean answering them, and a stored plan isn't shown", async () => {
    const id = await createAccount("a@example.com");
    db.update((await import("@/db/schema")).profile)
      .set({ eatingDisorderAnswer: null })
      .run();
    expect(getTodayPlanState(db, id, START)).toEqual({ kind: "answers-missing" });
  });

  test("a plan shows when everything is in order", async () => {
    const id = await createAccount("a@example.com");
    expect(getTodayPlanState(db, id, START)).toMatchObject({
      kind: "plan",
      position: { status: "active", day: 1 },
    });
  });

  test.each(["eatingDisorderAnswer", "medicalConditionAnswer"] as const)(
    "a yes to %s hides the plan, refuses ticks, and it returns afterward",
    async (answer) => {
      const id = await createAccount("a@example.com");
      const item = today(id, START).exercises[0];

      saveProfile(db, id, { ...ELIGIBLE, [answer]: "yes" });
      expect(getTodayPlanState(db, id, START)).toEqual({ kind: "no-plan-allowed" });

      await setPlanMarkAction(item.key, true);
      await setLoadMarkAction(item.key, true);
      expect(allMarks()).toEqual([]);
      expect(getActivePlan(db, id)).not.toBeNull();

      saveProfile(db, id, ELIGIBLE);
      expect(getTodayPlanState(db, id, START).kind).toBe("plan");
      await setPlanMarkAction(item.key, true);
      expect(allMarks()).toHaveLength(1);
    },
  );

  test("a low BMI hides a weight loss plan, and refuses its ticks", async () => {
    const id = await createAccount("a@example.com", testA);
    const item = today(id, START).exercises[0];

    saveProfile(db, id, { ...ELIGIBLE, heightCm: 100, weightKg: 18.49 });

    expect(getTodayPlanState(db, id, START)).toEqual({ kind: "plan-hidden" });
    await setPlanMarkAction(item.key, true);
    expect(allMarks()).toEqual([]);
  });

  test("a low BMI doesn't hide a plan for another goal", async () => {
    const id = await createAccount("a@example.com", testB);
    saveProfile(db, id, { ...ELIGIBLE, heightCm: 100, weightKg: 18.49 });
    expect(getTodayPlanState(db, id, START).kind).toBe("plan");
  });

  test("a stored plan that fails the checks isn't shown", async () => {
    const id = await createAccount("a@example.com", null);
    const month = validExerciseMonth(testB);
    month.weeks[2].days[0].aerobic[0].minutes = 299;
    saveActivePlan(
      db,
      id,
      { testProfileKey: testB.key, exercise: month, menu: validMenu(testB) },
      START,
    );

    expect(getTodayPlanState(db, id, START)).toEqual({ kind: "not-shown" });
  });
});

describe("weekly difficulty, through real ticks", () => {
  const minutesOn = (id: string, date: string) => today(id, date).aerobicMinutes;

  test("no ticks in week one holds week two", async () => {
    const id = await createAccount("a@example.com");
    const week1 = minutesOn(id, START);

    setClock(dateOfDay(8));
    expect(minutesOn(id, dateOfDay(8))).toBe(week1);
  });

  test("an exercise tick in week one moves week two up", async () => {
    const id = await createAccount("a@example.com");
    const week1 = minutesOn(id, START);
    await setPlanMarkAction(today(id, START).exercises[0].key, true);

    setClock(dateOfDay(8));
    expect(minutesOn(id, dateOfDay(8))).toBeGreaterThan(week1);
  });

  test("a week with only meal ticks also holds", async () => {
    const id = await createAccount("a@example.com");
    const week1 = minutesOn(id, START);
    await setPlanMarkAction(today(id, START).meals[0].key, true);

    setClock(dateOfDay(8));
    expect(getPlanProgress(db, id, getActivePlan(db, id)!.id).exerciseTickDates).toEqual([]);
    expect(minutesOn(id, dateOfDay(8))).toBe(week1);
  });

  test("sample list ticks don't count as plan ticks", async () => {
    const id = await createAccount("a@example.com");
    const week1 = minutesOn(id, START);
    await setMarkAction("exercise", "walking", true);

    setClock(dateOfDay(8));
    expect(minutesOn(id, dateOfDay(8))).toBe(week1);
  });

  test("ticks from a plan that was started over don't count", async () => {
    const id = await createAccount("a@example.com");
    await setPlanMarkAction(today(id, START).exercises[0].key, true);

    await expect(startOverAction()).rejects.toThrow("redirect:");
    saveActivePlan(
      db,
      id,
      {
        testProfileKey: testB.key,
        exercise: validExerciseMonth(testB),
        menu: validMenu(testB),
      },
      START,
    );

    expect(getPlanProgress(db, id, getActivePlan(db, id)!.id).exerciseTickDates).toEqual([]);
  });
});

describe("load marks", () => {
  test("a load can't be marked until it is ticked", async () => {
    const id = await createAccount("a@example.com");
    const item = exerciseOf(id, START, LOADED);

    await setLoadMarkAction(item.key, true);
    expect(allLoadMarks()).toEqual([]);

    await setPlanMarkAction(item.key, true);
    await setLoadMarkAction(item.key, true);
    expect(allLoadMarks()).toMatchObject([{ exerciseKey: LOADED, date: START }]);
  });

  test("unticking clears the mark", async () => {
    const id = await createAccount("a@example.com");
    const item = exerciseOf(id, START, LOADED);
    await setPlanMarkAction(item.key, true);
    await setLoadMarkAction(item.key, true);

    await setPlanMarkAction(item.key, false);

    expect(allLoadMarks()).toEqual([]);
  });

  test("a mark can be removed on its own", async () => {
    const id = await createAccount("a@example.com");
    const item = exerciseOf(id, START, LOADED);
    await setPlanMarkAction(item.key, true);
    await setLoadMarkAction(item.key, true);

    await setLoadMarkAction(item.key, false);

    expect(allLoadMarks()).toEqual([]);
    expect(allMarks()).toHaveLength(1);
  });

  test("a no-load or aerobic exercise can't be marked", async () => {
    const id = await createAccount("a@example.com");
    for (const key of ["brisk-walking", "knee-push-ups"]) {
      const item = exerciseOf(id, START, key);
      await setPlanMarkAction(item.key, true);
      await setLoadMarkAction(item.key, true);
    }
    expect(allLoadMarks()).toEqual([]);
  });

  test("a mark raises the load by at most 5% from the next week", async () => {
    const id = await createAccount("a@example.com");
    const item = exerciseOf(id, START, LOADED);
    await setPlanMarkAction(item.key, true);
    await setLoadMarkAction(item.key, true);

    expect(exerciseOf(id, START, LOADED)).toMatchObject({ loadKg: 6 });

    setClock(dateOfDay(8));
    expect(exerciseOf(id, dateOfDay(8), LOADED)).toMatchObject({
      loadKg: 6.3,
      change: "increased",
    });
  });

  test("an unmarked load stays the same", async () => {
    const id = await createAccount("a@example.com");
    await setPlanMarkAction(exerciseOf(id, START, LOADED).key, true);

    setClock(dateOfDay(8));
    expect(exerciseOf(id, dateOfDay(8), LOADED)).toMatchObject({
      loadKg: 6,
      change: "same",
    });
  });

  test("the browser can't choose which exercise gets the mark", async () => {
    const id = await createAccount("a@example.com");
    const item = exerciseOf(id, START, LOADED);
    await setPlanMarkAction(item.key, true);

    await setLoadMarkAction("dumbbell-rows-intermediate", true);

    expect(allLoadMarks()).toEqual([]);
  });

  test("starting over removes the plan's marks", async () => {
    const id = await createAccount("a@example.com");
    const item = exerciseOf(id, START, LOADED);
    await setPlanMarkAction(item.key, true);
    await setLoadMarkAction(item.key, true);

    await expect(startOverAction()).rejects.toThrow("redirect:");

    expect(allLoadMarks()).toEqual([]);
  });
});

describe("history", () => {
  test("plan ticks appear with their names, not including today", async () => {
    const id = await createAccount("a@example.com");
    const planDay = today(id, START);
    await setPlanMarkAction(planDay.exercises[0].key, true);
    await setPlanMarkAction(planDay.meals[0].key, true);

    expect(getHistory(db, id, START)).toEqual([]);

    setClock(dateOfDay(2));
    expect(getHistory(db, id, dateOfDay(2))).toEqual([
      {
        date: START,
        exercises: ["Brisk walking"],
        meals: ["Morning oats"],
        note: null,
      },
    ]);
  });

  test("past ticks remain after starting over", async () => {
    const id = await createAccount("a@example.com");
    await setPlanMarkAction(today(id, START).exercises[0].key, true);

    await expect(startOverAction()).rejects.toThrow("redirect:");

    expect(getHistory(db, id, dateOfDay(2))[0].exercises).toEqual(["Brisk walking"]);
  });
});

describe("sample lists and separation", () => {
  test("sample ticks still work with no plan, and don't need one", async () => {
    const id = await createAccount("a@example.com", null);

    await setMarkAction("exercise", "walking", true);

    expect([...getDayMarks(db, id, START).exercises]).toEqual(["walking"]);
  });

  test("sample ticks still work with a yes answer", async () => {
    const id = await createAccount("a@example.com", null);
    saveProfile(db, id, { ...ELIGIBLE, medicalConditionAnswer: "yes" });

    await setMarkAction("meal", "lunch", true);

    expect([...getDayMarks(db, id, START).meals]).toEqual(["lunch"]);
  });

  test("two accounts can't tick or mark each other's plan", async () => {
    const accountA = await createAccount("a@example.com");
    const itemA = exerciseOf(accountA, START, LOADED);

    const accountB = await createAccount("b@example.com");

    // Account B sends account A's keys, while logged in as B.
    await setPlanMarkAction(itemA.key, true);
    await setLoadMarkAction(itemA.key, true);

    expect(allMarks().filter((mark) => mark.userId === accountA)).toEqual([]);
    expect(allLoadMarks().filter((mark) => mark.userId === accountA)).toEqual([]);
    expect(getDayMarks(db, accountA, START).exercises.size).toBe(0);
    expect(accountB).not.toBe(accountA);

    await logIn("a@example.com");
    await setPlanMarkAction(itemA.key, true);
    await setLoadMarkAction(itemA.key, true);

    expect(getDayMarks(db, accountB, START).exercises.size).toBe(0);
    expect(allLoadMarks().filter((mark) => mark.userId === accountB)).toEqual([]);
  });
});
