import type { Metadata } from "next";
import { Suspense } from "react";

import { redirectIfLoggedIn } from "@/lib/auth-server";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

import { signUpAction } from "../account-actions";
import { AccountForm } from "../account-form";

export const metadata: Metadata = {
  title: `${WORDING.accounts.signUpHeading} | ${SITE_NAME}`,
};

async function LoggedInRedirect() {
  await redirectIfLoggedIn();
  return null;
}

export default function SignUpPage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <Suspense fallback={null}>
        <LoggedInRedirect />
      </Suspense>
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.accounts.signUpHeading}
      </h1>
      <p className="mt-3 opacity-80">{WORDING.accounts.signUpNotice}</p>
      <AccountForm
        action={signUpAction}
        submitLabel={WORDING.accounts.signUpButton}
        passwordAutoComplete="new-password"
        passwordHelp={WORDING.accounts.passwordHelp}
      />
    </main>
  );
}
