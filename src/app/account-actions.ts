"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { logIn, readCredentials, signUp } from "@/lib/accounts";
import { getAuth } from "@/lib/auth-server";
import { WORDING } from "@/lib/wording";

export type AccountFormState = { message: string; email: string };

function submittedEmail(formData: FormData): string {
  const email = formData.get("email");
  return typeof email === "string" ? email : "";
}

export async function signUpAction(
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = submittedEmail(formData);
  const credentials = readCredentials(formData);
  if (!credentials) {
    return { message: WORDING.accounts.missingDetails, email };
  }

  const result = await signUp(getAuth(), credentials, await headers());
  if (!result.ok) return { message: result.message, email };

  redirect("/profile");
}

export async function logInAction(
  _previous: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const email = submittedEmail(formData);
  const credentials = readCredentials(formData);
  if (!credentials) {
    return { message: WORDING.accounts.missingDetails, email };
  }

  const result = await logIn(getAuth(), credentials, await headers());
  if (!result.ok) return { message: result.message, email };

  redirect("/profile");
}

export async function logOutAction(): Promise<void> {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/log-in");
}
