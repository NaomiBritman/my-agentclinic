import { afterAll, afterEach, beforeEach, expect, test, vi } from "vitest";

import { dayNote, trackingMark, user } from "@/db/schema";
import { createTestDatabase } from "@/db/test-database";
import { signUp } from "@/lib/accounts";
import { getAuth } from "@/lib/auth-server";
import { saveProfile } from "@/lib/profiles";
import { getDayMarks, getHistory, getNote } from "@/lib/tracking";
import { WORDING } from "@/lib/wording";

import { saveNoteAction, setMarkAction, type NoteFormState } from "./actions";

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

const testDatabase = createTestDatabase();

vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-only-used-by-these-tests");
vi.stubEnv("BETTER_AUTH_URL", "http://127.0.0.1:3000");

const PASSWORD = "not-a-real-password";
const EMPTY_NOTE: NoteFormState = { text: "", message: "", saved: false };
const TODAY = "2026-03-10";

function note(fields: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.set(key, value);
  return saveNoteAction(EMPTY_NOTE, formData);
}

/** Creates an account, with or without a saved profile. */
async function createAccount(email: string, { withProfile = true } = {}) {
  const auth = getAuth();
  await signUp(auth, { email, password: PASSWORD }, new Headers());
  const { headers, response } = await auth.api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  });
  if (withProfile) {
    // Height and weight are deliberately unrealistic test values.
    saveProfile(testDatabase.db, response.user.id, {
      age: 18,
      heightCm: 1,
      weightKg: 1,
      fitnessLevel: "beginner",
      goal: "toning",
      eatingDisorderAnswer: "no",
      medicalConditionAnswer: "no",
    });
  }
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]);
  return {
    id: response.user.id,
    headers: new Headers({ cookie: cookie.join("; ") }),
  };
}

function setClock(date: string) {
  vi.setSystemTime(new Date(`${date}T12:00:00`));
}

function savedCounts() {
  return {
    marks: testDatabase.db.select().from(trackingMark).all().length,
    notes: testDatabase.db.select().from(dayNote).all().length,
  };
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  setClock(TODAY);
  testDatabase.db.delete(user).run();
  requestHeaders.current = new Headers();
});

afterEach(() => {
  vi.useRealTimers();
});

afterAll(() => {
  testDatabase.cleanup();
});

test("a logged-out visitor can't save marks or notes", async () => {
  await expect(setMarkAction("exercise", "walking", true)).rejects.toThrow(
    "redirect:/log-in",
  );
  await expect(note({ note: "A note" })).rejects.toThrow("redirect:/log-in");

  expect(savedCounts()).toEqual({ marks: 0, notes: 0 });
});

test("without a saved profile, marks and notes can't be saved", async () => {
  const account = await createAccount("a@example.com", { withProfile: false });
  requestHeaders.current = account.headers;

  await expect(setMarkAction("exercise", "walking", true)).rejects.toThrow(
    "redirect:/profile",
  );
  await expect(note({ note: "A note" })).rejects.toThrow("redirect:/profile");

  expect(savedCounts()).toEqual({ marks: 0, notes: 0 });
});

test("ticking and unticking save for today, on the server's date", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await setMarkAction("exercise", "walking", true);
  await setMarkAction("meal", "lunch", true);

  const marks = getDayMarks(testDatabase.db, account.id, TODAY);
  expect([...marks.exercises]).toEqual(["walking"]);
  expect([...marks.meals]).toEqual(["lunch"]);

  await setMarkAction("exercise", "walking", false);

  expect(
    getDayMarks(testDatabase.db, account.id, TODAY).exercises.size,
  ).toBe(0);
});

test("a date sent by the browser can't change which day is saved", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  const sendWithDate = setMarkAction as unknown as (
    ...args: unknown[]
  ) => Promise<void>;
  await sendWithDate("exercise", "walking", true, "2026-01-01");
  await note({ note: "A note", date: "2026-01-01" });

  const rows = testDatabase.db.select().from(trackingMark).all();
  expect(rows.map((row) => row.date)).toEqual([TODAY]);
  expect(getNote(testDatabase.db, account.id, TODAY)).toBe("A note");
  expect(getNote(testDatabase.db, account.id, "2026-01-01")).toBe("");
});

test.each([
  ["an unknown type", "made-up", "walking", true],
  ["an unknown item", "exercise", "made-up", true],
  ["a meal under the wrong type", "exercise", "lunch", true],
  ["a value that isn't true or false", "exercise", "walking", "yes"],
])("%s saves nothing", async (_name, itemType, itemKey, marked) => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await setMarkAction(itemType, itemKey, marked);

  expect(savedCounts().marks).toBe(0);
});

test("a note saves as written, and over-long text is refused", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  const saved = await note({ note: "  As written  " });
  expect(saved).toEqual({
    text: "  As written  ",
    message: "",
    saved: true,
  });

  const tooLong = "x".repeat(2001);
  const refused = await note({ note: tooLong });
  expect(refused).toEqual({
    text: tooLong,
    message: WORDING.today.noteTooLong,
    saved: false,
  });
  expect(getNote(testDatabase.db, account.id, TODAY)).toBe("  As written  ");
});

test("the next day starts clear, and the earlier day moves to history", async () => {
  const account = await createAccount("a@example.com");
  requestHeaders.current = account.headers;

  await setMarkAction("exercise", "walking", true);
  await note({ note: "A note" });

  setClock("2026-03-11");

  const { db } = testDatabase;
  expect(getDayMarks(db, account.id, "2026-03-11").exercises.size).toBe(0);
  expect(getHistory(db, account.id, "2026-03-11")).toEqual([
    { date: TODAY, exercises: ["Walking"], meals: [], note: "A note" },
  ]);
});

test("two accounts can't read or change each other's tracking", async () => {
  const accountA = await createAccount("a@example.com");
  const accountB = await createAccount("b@example.com");
  const { db } = testDatabase;

  requestHeaders.current = accountA.headers;
  await setMarkAction("exercise", "walking", true);
  await note({ note: "Account A's note" });

  // Account B tries to clear A's mark, and names A in the form.
  requestHeaders.current = accountB.headers;
  await setMarkAction("exercise", "walking", false);
  await note({ note: "", userId: accountA.id, accountId: accountA.id });

  expect(getDayMarks(db, accountA.id, TODAY).exercises.size).toBe(1);
  expect(getNote(db, accountA.id, TODAY)).toBe("Account A's note");
  expect(getDayMarks(db, accountB.id, TODAY).exercises.size).toBe(0);
  expect(getNote(db, accountB.id, TODAY)).toBe("");
  expect(getHistory(db, accountB.id, "2026-03-11")).toEqual([]);
});
