import { afterAll, beforeEach, expect, test, vi } from "vitest";

import { profile, user } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { signUp } from "@/lib/accounts";
import { getAuth, requireAccountWithProfile } from "@/lib/auth-server";
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
  values: { age: "", heightCm: "", weightKg: "", fitnessLevel: "", goal: "" },
  errors: {},
  saved: false,
};

// Height and weight are deliberately unrealistic test values, not health data.
const VALID_FIELDS = {
  age: "18",
  heightCm: "1",
  weightKg: "1",
  fitnessLevel: "beginner",
  goal: "toning",
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
