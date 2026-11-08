import Link from "next/link";
import { Suspense } from "react";

import { getCurrentAccount } from "@/lib/auth-server";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

import { logOutAction } from "./account-actions";

const linkClasses = "underline-offset-4 hover:underline";

async function AccountNavigation() {
  const account = await getCurrentAccount();

  if (!account) {
    return (
      <>
        <Link href="/sign-up" className={linkClasses}>
          {WORDING.accounts.signUpHeading}
        </Link>
        <Link href="/log-in" className={linkClasses}>
          {WORDING.accounts.logInHeading}
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/today" className={linkClasses}>
        {WORDING.navigation.today}
      </Link>
      <Link href="/profile" className={linkClasses}>
        {WORDING.navigation.profile}
      </Link>
      <form action={logOutAction}>
        <button type="submit" className={`${linkClasses} cursor-pointer`}>
          {WORDING.accounts.logOutButton}
        </button>
      </form>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-foreground/15 px-4 py-4">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href="/" className="font-semibold">
          {SITE_NAME}
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Suspense fallback={null}>
            <AccountNavigation />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
