import { LogIn } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, PageBand, PageContent } from "@/components/ui";
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
    <main>
      <Suspense fallback={null}>
        <LoggedInRedirect />
      </Suspense>
      <PageBand
        icon={LogIn}
        title={WORDING.accounts.logInHeading}
        width="narrow"
      />
      <PageContent width="narrow">
        <Card>
          <AccountForm
            action={logInAction}
            submitLabel={WORDING.accounts.logInButton}
            passwordAutoComplete="current-password"
          />
        </Card>
      </PageContent>
    </main>
  );
}
