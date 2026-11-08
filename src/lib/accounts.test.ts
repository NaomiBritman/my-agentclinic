import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { account as accountTable, user } from "@/db/schema";
import { createTestDatabase, type TestDatabase } from "@/db/test-database";

import { findAccount, logIn, readCredentials, signUp } from "./accounts";
import { createAuth, type Auth } from "./auth";
import { WORDING } from "./wording";

const PASSWORD = "not-a-real-password";

let database: TestDatabase;
let auth: Auth;

beforeEach(() => {
  database = createTestDatabase();
  auth = createAuth({
    db: database.db,
    secret: "test-secret-that-is-only-used-by-these-tests",
    baseURL: "http://127.0.0.1:3000",
  });
});

afterEach(() => {
  database.cleanup();
});

/** Logs in and returns request headers carrying that session's cookie. */
async function sessionHeaders(email: string, password = PASSWORD) {
  const { headers } = await auth.api.signInEmail({
    body: { email, password },
    returnHeaders: true,
  });
  const cookie = headers.getSetCookie().map((value) => value.split(";")[0]);
  return new Headers({ cookie: cookie.join("; ") });
}

describe("reading credentials", () => {
  function form(fields: Record<string, string>) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) {
      formData.set(key, value);
    }
    return formData;
  }

  test("trims the email and keeps the password as typed", () => {
    expect(
      readCredentials(form({ email: " a@example.com ", password: " pass " })),
    ).toEqual({ email: "a@example.com", password: " pass " });
  });

  test("refuses missing or empty details", () => {
    expect(readCredentials(form({ email: "a@example.com" }))).toBeNull();
    expect(readCredentials(form({ password: PASSWORD }))).toBeNull();
    expect(readCredentials(form({ email: "  ", password: PASSWORD }))).toBeNull();
    expect(readCredentials(form({ email: "a@example.com", password: "" }))).toBeNull();
  });
});

describe("sign-up", () => {
  test("valid details create an account", async () => {
    const result = await signUp(
      auth,
      { email: "a@example.com", password: PASSWORD },
      new Headers(),
    );

    expect(result).toEqual({ ok: true });
    expect(database.db.select().from(user).all()).toHaveLength(1);
  });

  test("the stored password isn't the plain text", async () => {
    await signUp(
      auth,
      { email: "a@example.com", password: PASSWORD },
      new Headers(),
    );

    const [stored] = database.db.select().from(accountTable).all();
    expect(stored.password).toBeTruthy();
    expect(stored.password).not.toContain(PASSWORD);
  });

  test.each([
    ["an invalid email", "not-an-email", PASSWORD, WORDING.accounts.invalidEmail],
    ["a short password", "a@example.com", "short", WORDING.accounts.passwordTooShort],
    ["a long password", "a@example.com", "x".repeat(500), WORDING.accounts.passwordTooLong],
  ])("%s is refused", async (_name, email, password, message) => {
    const result = await signUp(auth, { email, password }, new Headers());

    expect(result).toEqual({ ok: false, message });
    expect(database.db.select().from(user).all()).toHaveLength(0);
  });

  test("a duplicate email is refused, whatever its capitalization", async () => {
    await signUp(
      auth,
      { email: "a@example.com", password: PASSWORD },
      new Headers(),
    );

    const result = await signUp(
      auth,
      { email: "A@Example.com", password: PASSWORD },
      new Headers(),
    );

    expect(result).toEqual({
      ok: false,
      message: WORDING.accounts.emailInUse,
    });
    expect(database.db.select().from(user).all()).toHaveLength(1);
  });
});

describe("log in and log out", () => {
  beforeEach(async () => {
    await signUp(
      auth,
      { email: "a@example.com", password: PASSWORD },
      new Headers(),
    );
  });

  test("correct details log in", async () => {
    const result = await logIn(
      auth,
      { email: "a@example.com", password: PASSWORD },
      new Headers(),
    );

    expect(result).toEqual({ ok: true });
  });

  test("a wrong password and an unknown email get the same message", async () => {
    const wrongPassword = await logIn(
      auth,
      { email: "a@example.com", password: "wrong-password" },
      new Headers(),
    );
    const unknownEmail = await logIn(
      auth,
      { email: "nobody@example.com", password: PASSWORD },
      new Headers(),
    );
    const invalidEmail = await logIn(
      auth,
      { email: "not-an-email", password: PASSWORD },
      new Headers(),
    );

    const refused = { ok: false, message: WORDING.accounts.logInFailed };
    expect(wrongPassword).toEqual(refused);
    expect(unknownEmail).toEqual(refused);
    expect(invalidEmail).toEqual(refused);
  });

  test("a request with no session has no account", async () => {
    expect(await findAccount(auth, new Headers())).toBeNull();
  });

  test("a made-up session cookie has no account", async () => {
    const headers = new Headers({
      cookie: "better-auth.session_token=made-up-token",
    });

    expect(await findAccount(auth, headers)).toBeNull();
  });

  test("an ended session no longer gives access", async () => {
    const headers = await sessionHeaders("a@example.com");
    expect(await findAccount(auth, headers)).not.toBeNull();

    await auth.api.signOut({ headers });

    expect(await findAccount(auth, headers)).toBeNull();
  });
});

describe("two accounts", () => {
  test("each session returns only its own account", async () => {
    await signUp(
      auth,
      { email: "a@example.com", password: PASSWORD },
      new Headers(),
    );
    await signUp(
      auth,
      { email: "b@example.com", password: PASSWORD },
      new Headers(),
    );

    const accountA = await findAccount(
      auth,
      await sessionHeaders("a@example.com"),
    );
    const accountB = await findAccount(
      auth,
      await sessionHeaders("b@example.com"),
    );

    expect(accountA?.email).toBe("a@example.com");
    expect(accountB?.email).toBe("b@example.com");
    expect(accountA?.id).not.toBe(accountB?.id);

    const stored = database.db
      .select()
      .from(user)
      .where(eq(user.id, accountA!.id))
      .all();
    expect(stored).toHaveLength(1);
  });
});
