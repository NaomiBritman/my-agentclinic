import type { Metadata } from "next";
import { Suspense } from "react";

import { redirectIfLoggedIn } from "@/lib/auth-server";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

import { logInAction } from "../account-actions";
import { AccountForm } from "../account-form";

export const metadata: Metadata = {
  title: `${WORDING.accounts.logInHeading} | ${SITE_NAME}`,
};

async function LoggedInRedirect() {
  await redirectIfLoggedIn();
  return null;
}

export default function LogInPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Suspense fallback={null}>
        <LoggedInRedirect />
      </Suspense>
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.accounts.logInHeading}
      </h1>
      <AccountForm
        action={logInAction}
        submitLabel={WORDING.accounts.logInButton}
        passwordAutoComplete="current-password"
      />
    </main>
  );
}
