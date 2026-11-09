import { eq } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

import { profile, user } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { signUp } from "@/lib/accounts";
import { getAuth, requireAccountWithProfile } from "@/lib/auth-server";
import { getEligibilityMessage, getTestPlanAccess } from "@/lib/plan-access";
import { getProfile } from "@/lib/profiles";
import { WORDING } from "@/lib/wording";

import { saveProfileAction, type ProfileFormState } from "./actions";

const { requestHeaders } = vi.hoisted(() => ({
  requestHeaders: { current: new Headers() },
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

const testDatabase = createTestDatabase();

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-only-used-by-these-tests");
vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");

const PASSWORD = "not-a-real-password";
const EMPTY_STATE: ProfileFormState = {
  values: {
    age: "",
    heightCm: "",
    weightKg: "",
    fitnessLevel: "",
    goal: "",
    eatingDisorderAnswer: "",
    medicalConditionAnswer: "",
  },
  errors: {},
  saved: false,
  eligibilityMessage: null,
};

// Height and weight are deliberately unrealistic test values, not health data.
const VALID_FIELDS = {
  age: "18",
  heightCm: "1",
  weightKg: "1",
  fitnessLevel: "beginner",
  goal: "toning",
  eatingDisorderAnswer: "no",
  medicalConditionAnswer: "no",
};

function form(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return formData;
}

function save(fields: Record<string, string>) {
  return saveProfileAction(EMPTY_STATE, form(fields));
}

/** Creates an account and returns its ID and its session's request headers. */
async function createAccount(email: string) {
  const auth = getAuth();
  await signUp(auth, { email, password: PASSWORD }, new Headers());
  const { headers, response } = await auth.api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  });
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]);
  return {
    id: response.user.id,
    headers: new Headers({ cookie: cookie.join("; ") }),
  };
}

beforeEach(() => {
  testDatabase.db.delete(user).run();
  requestHeaders.current = new Headers();
});

afterAll(() => {
  testDatabase.cleanup();
});

test("a logged-out visitor can't save a profile", async () => {
  await expect(save(VALID_FIELDS)).rejects.toThrow("redirect:/log-in");
  expect(testDatabase.db.select().from(profile).all()).toHaveLength(0);
});

test("a valid profile saves, and reads back", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  const state = await save(VALID_FIELDS);

  expect(state.saved).toBe(true);
  expect(getProfile(testDatabase.db, account.id)).toEqual({
    age: 18,
    heightCm: 1,
    weightKg: 1,
    fitnessLevel: "beginner",
    goal: "toning",
    eatingDisorderAnswer: "no",
    medicalConditionAnswer: "no",
  });
});

test("an age of 17 saves nothing, and keeps what was typed", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  const state = await save({ ...VALID_FIELDS, age: "17" });

  expect(state.saved).toBe(false);
  expect(state.errors.age).toBe(WORDING.profile.underAge);
  expect(state.values.age).toBe("17");
  expect(state.values.goal).toBe("toning");
  expect(getProfile(testDatabase.db, account.id)).toBeNull();
});

test("saving again replaces the old values and keeps one row", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await save(VALID_FIELDS);
  await save({ ...VALID_FIELDS, weightKg: "2", goal: "weight-loss" });

  expect(testDatabase.db.select().from(profile).all()).toHaveLength(1);
  expect(getProfile(testDatabase.db, account.id)).toMatchObject({
    weightKg: 2,
    goal: "weight-loss",
  });
});

test("an invalid edit leaves the saved profile unchanged", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await save(VALID_FIELDS);
  await save({ ...VALID_FIELDS, age: "17", weightKg: "2" });

  expect(getProfile(testDatabase.db, account.id)).toMatchObject({
    age: 18,
    weightKg: 1,
  });
});

test("two accounts can't read or change each other's profile", async () => {
  const accountA = await createAccount("a@example.com");
  const accountB = await createAccount("b@example.com");

  requestHeaders.current = accountA.headers;
  await save({ ...VALID_FIELDS, goal: "toning" });

  // Account B names account A in the form, which must be ignored.
  requestHeaders.current = accountB.headers;
  await save({
    ...VALID_FIELDS,
    goal: "muscle-building",
    userId: accountA.id,
    accountId: accountA.id,
  });

  expect(getProfile(testDatabase.db, accountA.id)?.goal).toBe("toning");
  expect(getProfile(testDatabase.db, accountB.id)?.goal).toBe(
    "muscle-building",
  );
});

test("tracking pages need a saved profile", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await expect(requireAccountWithProfile()).rejects.toThrow("redirect:/profile");

  await save(VALID_FIELDS);

  await expect(requireAccountWithProfile()).resolves.toMatchObject({
    id: account.id,
  });
});

test("a refused under-18 profile doesn't open tracking pages", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await save({ ...VALID_FIELDS, age: "17" });

  await expect(requireAccountWithProfile()).rejects.toThrow("redirect:/profile");
});

test("a logged-out visitor to a tracking page is sent to log in", async () => {
  await expect(requireAccountWithProfile()).rejects.toThrow("redirect:/log-in");
});

describe("eligibility", () => {
  const LOW_BMI = { heightCm: "100", weightKg: "18.49" };

  async function loggedIn(email = "a@example.com") {
    const account = await createAccount(email);
    requestHeaders.current = account.headers;
    return account;
  }

  test("unanswered questions save nothing, and keep what was typed", async () => {
    const account = await loggedIn();

    const state = await save({
      ...VALID_FIELDS,
      eatingDisorderAnswer: "",
      medicalConditionAnswer: "",
    });

    expect(state.saved).toBe(false);
    expect(state.errors.eatingDisorderAnswer).toBe(
      WORDING.eligibility.answerRequired,
    );
    expect(state.values.age).toBe("18");
    expect(getProfile(testDatabase.db, account.id)).toBeNull();
  });

  test.each(["eatingDisorderAnswer", "medicalConditionAnswer"])(
    "a yes to %s saves, shows the message and leaves no plans available",
    async (field) => {
      const account = await loggedIn();

      const state = await save({ ...VALID_FIELDS, [field]: "yes" });

      expect(state.saved).toBe(true);
      expect(state.eligibilityMessage).toBe(WORDING.eligibility.noPlan);
      expect(getTestPlanAccess(testDatabase.db, account.id)).toEqual({
        status: "no-plan",
      });
    },
  );

  test("changing a yes back to no restores access and clears the message", async () => {
    const account = await loggedIn();

    await save({ ...VALID_FIELDS, medicalConditionAnswer: "yes" });
    const state = await save(VALID_FIELDS);

    expect(state.eligibilityMessage).toBeNull();
    expect(getTestPlanAccess(testDatabase.db, account.id).status).toBe(
      "available",
    );
  });

  test("weight loss with a low BMI isn't saved, and keeps what was typed", async () => {
    const account = await loggedIn();

    const state = await save({
      ...VALID_FIELDS,
      ...LOW_BMI,
      goal: "weight-loss",
    });

    expect(state.saved).toBe(false);
    expect(state.errors.goal).toBe(WORDING.eligibility.noWeightLossPlan);
    expect(state.values.weightKg).toBe("18.49");
    expect(getProfile(testDatabase.db, account.id)).toBeNull();
  });

  test("an edit that would break the BMI rule leaves the saved profile unchanged", async () => {
    const account = await loggedIn();

    await save({ ...VALID_FIELDS, goal: "weight-loss" });
    const state = await save({
      ...VALID_FIELDS,
      ...LOW_BMI,
      goal: "weight-loss",
    });

    expect(state.saved).toBe(false);
    expect(getProfile(testDatabase.db, account.id)?.weightKg).toBe(1);
  });

  test("another goal saves with a low BMI, with weight loss plans hidden", async () => {
    const account = await loggedIn();

    const state = await save({ ...VALID_FIELDS, ...LOW_BMI, goal: "toning" });

    expect(state.saved).toBe(true);
    expect(state.eligibilityMessage).toBeNull();
    expect(getTestPlanAccess(testDatabase.db, account.id)).toEqual({
      status: "available",
      hiddenGoals: ["weight-loss"],
    });
  });

  test("an older saved weight loss profile with a low BMI gets the message", async () => {
    const account = await loggedIn();

    await save({ ...VALID_FIELDS, ...LOW_BMI, goal: "toning" });
    testDatabase.db
      .update(profile)
      .set({ goal: "weight-loss" })
      .where(eq(profile.userId, account.id))
      .run();

    const saved = getProfile(testDatabase.db, account.id);
    expect(saved && getEligibilityMessage(saved)).toBe(
      WORDING.eligibility.noWeightLossPlan,
    );
  });

  test("a profile with no answers keeps tracking, with test plans unavailable", async () => {
    const account = await loggedIn();

    await save(VALID_FIELDS);
    testDatabase.db
      .update(profile)
      .set({ eatingDisorderAnswer: null, medicalConditionAnswer: null })
      .where(eq(profile.userId, account.id))
      .run();

    await expect(requireAccountWithProfile()).resolves.toMatchObject({
      id: account.id,
    });
    expect(getTestPlanAccess(testDatabase.db, account.id)).toEqual({
      status: "answers-missing",
    });
  });

  test("an unexpected stored answer counts as unanswered", async () => {
    const account = await loggedIn();

    await save(VALID_FIELDS);
    testDatabase.db
      .update(profile)
      .set({ eatingDisorderAnswer: "maybe" })
      .where(eq(profile.userId, account.id))
      .run();

    expect(getTestPlanAccess(testDatabase.db, account.id).status).toBe(
      "answers-missing",
    );
  });

  test("a yes answer doesn't stop tracking", async () => {
    const account = await loggedIn();

    await save({ ...VALID_FIELDS, eatingDisorderAnswer: "yes" });

    await expect(requireAccountWithProfile()).resolves.toMatchObject({
      id: account.id,
    });
  });

  test("an account with no profile has no test plans", async () => {
    const account = await loggedIn();

    expect(getTestPlanAccess(testDatabase.db, account.id)).toEqual({
      status: "no-profile",
    });
  });

  test("two accounts can't read or change each other's answers", async () => {
    const accountA = await createAccount("a@example.com");
    const accountB = await createAccount("b@example.com");

    requestHeaders.current = accountA.headers;
    await save({ ...VALID_FIELDS, eatingDisorderAnswer: "yes" });

    // Account B names account A in the form, which must be ignored.
    requestHeaders.current = accountB.headers;
    const state = await save({ ...VALID_FIELDS, userId: accountA.id });

    expect(state.eligibilityMessage).toBeNull();
    expect(getProfile(testDatabase.db, accountA.id)?.eatingDisorderAnswer).toBe(
      "yes",
    );
    expect(getProfile(testDatabase.db, accountB.id)?.eatingDisorderAnswer).toBe(
      "no",
    );
    expect(getTestPlanAccess(testDatabase.db, accountA.id).status).toBe("no-plan");
    expect(getTestPlanAccess(testDatabase.db, accountB.id).status).toBe("available");
  });
});
