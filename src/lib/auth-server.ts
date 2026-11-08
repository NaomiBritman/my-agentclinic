import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getDatabase } from "@/db/database";

import { findAccount, type Account } from "./accounts";
import { createAuth, type Auth } from "./auth";
import { getProfile } from "./profiles";

let auth: Auth | undefined;

export function getAuth(): Auth {
  if (auth) return auth;

  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || !baseURL) {
    throw new Error(
      "BETTER_AUTH_SECRET and BETTER_AUTH_URL must be set in .env. See .env.example.",
    );
  }

  auth = createAuth({
    db: getDatabase(),
    secret,
    baseURL,
    plugins: [nextCookies()],
  });
  return auth;
}

/** The logged-in account, or null. Reads the session on the server each time. */
export async function getCurrentAccount(): Promise<Account | null> {
  // Reading the headers first stops the build's prerender before it gets to
  // the secret or the database, which only exist when the site is running.
  const requestHeaders = await headers();
  return findAccount(getAuth(), requestHeaders);
}

/** The logged-in account. Sends anyone else to the log-in page. */
export async function requireAccount(): Promise<Account> {
  const account = await getCurrentAccount();
  if (!account) redirect("/log-in");
  return account;
}

/** The logged-in account. Sends anyone without a saved profile to the form. */
export async function requireAccountWithProfile(): Promise<Account> {
  const account = await requireAccount();
  if (!getProfile(getDatabase(), account.id)) redirect("/profile");
  return account;
}

/** Sends anyone already logged in away from the sign-up and log-in pages. */
export async function redirectIfLoggedIn(): Promise<void> {
  if (await getCurrentAccount()) redirect("/today");
}
