import {
  Activity,
  CalendarCheck,
  ClipboardList,
  FlaskConical,
  History,
  LogIn,
  LogOut,
  PenLine,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { getDatabase } from "@/db/database";
import { getCurrentAccount } from "@/lib/auth-server";
import { getTestPlanAccess } from "@/lib/plan-access";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

import { logOutAction } from "./account-actions";
import { navItemClasses } from "./nav-classes";
import { NavLink } from "./nav-link";

const iconClasses = "size-5 shrink-0";

async function AccountNavigation() {
  const account = await getCurrentAccount();

  if (!account) {
    return (
      <>
        <NavLink href="/sign-up">
          <PenLine aria-hidden className={iconClasses} />
          {WORDING.accounts.signUpHeading}
        </NavLink>
        <NavLink href="/log-in">
          <LogIn aria-hidden className={iconClasses} />
          {WORDING.accounts.logInHeading}
        </NavLink>
      </>
    );
  }

  return (
    <>
      <NavLink href="/today">
        <CalendarCheck aria-hidden className={iconClasses} />
        {WORDING.navigation.today}
      </NavLink>
      <NavLink href="/history">
        <History aria-hidden className={iconClasses} />
        {WORDING.navigation.history}
      </NavLink>
      <NavLink href="/profile">
        <ClipboardList aria-hidden className={iconClasses} />
        {WORDING.navigation.profile}
      </NavLink>
      {getTestPlanAccess(getDatabase(), account.id).status === "available" ? (
        <NavLink href="/test-plans">
          <FlaskConical aria-hidden className={iconClasses} />
          {WORDING.navigation.testPlans}
        </NavLink>
      ) : null}
      <form action={logOutAction} className="contents">
        <button type="submit" className={navItemClasses}>
          <LogOut aria-hidden className={iconClasses} />
          {WORDING.accounts.logOutButton}
        </button>
      </form>
    </>
  );
}

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-card py-2">
      <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 self-start text-lg font-bold sm:self-auto"
        >
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-band-from to-band-to text-band-ink">
            <Activity aria-hidden className="size-5" />
          </span>
          {SITE_NAME}
        </Link>
        <nav
          aria-label={WORDING.navigation.siteLabel}
          className="grid auto-cols-fr grid-flow-col gap-1 sm:flex sm:items-center"
        >
          <Suspense fallback={null}>
            <AccountNavigation />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
