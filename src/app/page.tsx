import { CalendarCheck, Dumbbell, History, Salad } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  bandButtonClasses,
  bandOutlineButtonClasses,
  Card,
  cardLinkClasses,
  PageContent,
  SectionHeading,
} from "@/components/ui";
import { getDatabase } from "@/db/database";
import { getCurrentAccount } from "@/lib/auth-server";
import { getProfile } from "@/lib/profiles";
import { MISSION_SENTENCE, SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

async function RedirectWithProfile() {
  const account = await getCurrentAccount();
  if (account && getProfile(getDatabase(), account.id)) redirect("/today");
  return null;
}

export default function Home() {
  return (
    <main>
      <Suspense fallback={null}>
        <RedirectWithProfile />
      </Suspense>
      <div className="on-band bg-gradient-to-br from-band-from to-band-to text-band-ink">
        <div className="mx-auto max-w-5xl px-4 pt-12 pb-24 sm:pt-20 sm:pb-32">
          <span aria-hidden className="block h-1.5 w-20 rounded-full bg-accent" />
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            {SITE_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 sm:text-xl">
            {MISSION_SENTENCE}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/sign-up" className={bandButtonClasses}>
              {WORDING.accounts.signUpHeading}
            </Link>
            <Link href="/log-in" className={bandOutlineButtonClasses}>
              {WORDING.accounts.logInHeading}
            </Link>
          </div>
        </div>
      </div>
      <PageContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/today" className={cardLinkClasses}>
            <Card accent="teal">
              <SectionHeading icon={CalendarCheck} tone="teal">
                {WORDING.today.heading}
              </SectionHeading>
            </Card>
          </Link>
          <Link href="/today#exercises" className={cardLinkClasses}>
            <Card accent="coral">
              <SectionHeading icon={Dumbbell} tone="coral">
                {WORDING.today.exercisesHeading}
              </SectionHeading>
            </Card>
          </Link>
          <Link href="/today#menu" className={cardLinkClasses}>
            <Card accent="teal">
              <SectionHeading icon={Salad} tone="teal">
                {WORDING.today.menuHeading}
              </SectionHeading>
            </Card>
          </Link>
          <Link href="/history" className={cardLinkClasses}>
            <Card accent="coral">
              <SectionHeading icon={History} tone="coral">
                {WORDING.history.heading}
              </SectionHeading>
            </Card>
          </Link>
        </div>
      </PageContent>
    </main>
  );
}
