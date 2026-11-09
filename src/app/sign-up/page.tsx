import { PenLine } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, Notice, PageBand, PageContent } from "@/components/ui";
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
    <main>
      <Suspense fallback={null}>
        <LoggedInRedirect />
      </Suspense>
      <PageBand
        icon={PenLine}
        title={WORDING.accounts.signUpHeading}
        width="narrow"
      />
      <PageContent width="narrow">
        <Card className="space-y-5">
          <Notice>{WORDING.accounts.signUpNotice}</Notice>
          <AccountForm
            action={signUpAction}
            submitLabel={WORDING.accounts.signUpButton}
            passwordAutoComplete="new-password"
            passwordHelp={WORDING.accounts.passwordHelp}
          />
        </Card>
      </PageContent>
    </main>
  );
}
