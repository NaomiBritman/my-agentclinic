import { isAPIError } from "better-auth/api";

import type { Auth } from "./auth";
import { WORDING } from "./wording";

export type Credentials = { email: string; password: string };

export type Account = { id: string; email: string };

export type AccountResult = { ok: true } | { ok: false; message: string };

const SIGN_UP_MESSAGES: Record<string, string> = {
  INVALID_EMAIL: WORDING.accounts.invalidEmail,
  // The library's own input check, which only the email can fail here.
  VALIDATION_ERROR: WORDING.accounts.invalidEmail,
  PASSWORD_TOO_SHORT: WORDING.accounts.passwordTooShort,
  PASSWORD_TOO_LONG: WORDING.accounts.passwordTooLong,
  USER_ALREADY_EXISTS: WORDING.accounts.emailInUse,
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: WORDING.accounts.emailInUse,
};

/** Reads credentials from untrusted form data. Returns null if any are missing. */
export function readCredentials(formData: FormData): Credentials | null {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") return null;

  const trimmedEmail = email.trim();
  if (trimmedEmail === "" || password === "") return null;

  return { email: trimmedEmail, password };
}

export async function signUp(
  auth: Auth,
  { email, password }: Credentials,
  headers: Headers,
): Promise<AccountResult> {
  try {
    // Better Auth requires a name, but the site only collects an email.
    await auth.api.signUpEmail({
      body: { email, password, name: "" },
      headers,
    });
    return { ok: true };
  } catch (error) {
    if (isAPIError(error)) {
      const code = error.body?.code;
      return {
        ok: false,
        message:
          (code && SIGN_UP_MESSAGES[code]) || WORDING.accounts.signUpFailed,
      };
    }
    throw error;
  }
}

export async function logIn(
  auth: Auth,
  { email, password }: Credentials,
  headers: Headers,
): Promise<AccountResult> {
  try {
    await auth.api.signInEmail({ body: { email, password }, headers });
    return { ok: true };
  } catch (error) {
    if (isAPIError(error)) {
      // One message for every refusal, so it never reveals which detail failed.
      return { ok: false, message: WORDING.accounts.logInFailed };
    }
    throw error;
  }
}

/** Finds the account for a request's session, or null if there is none. */
export async function findAccount(
  auth: Auth,
  headers: Headers,
): Promise<Account | null> {
  const session = await auth.api.getSession({
    headers,
    // Always checks the stored session, so an ended one stops working at once.
    query: { disableCookieCache: true },
  });

  return session ? { id: session.user.id, email: session.user.email } : null;
}
