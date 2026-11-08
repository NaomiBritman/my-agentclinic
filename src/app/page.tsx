import { redirect } from "next/navigation";
import { Suspense } from "react";

import { getDatabase } from "@/db/database";
import { getCurrentAccount } from "@/lib/auth-server";
import { getProfile } from "@/lib/profiles";
import { MISSION_SENTENCE, SITE_NAME } from "@/lib/site";

async function RedirectWithProfile() {
  const account = await getCurrentAccount();
  if (account && getProfile(getDatabase(), account.id)) redirect("/today");
  return null;
}

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      <Suspense fallback={null}>
        <RedirectWithProfile />
      </Suspense>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
        {SITE_NAME}
      </h1>
      <p className="mt-4 text-lg leading-8 opacity-80">{MISSION_SENTENCE}</p>
    </main>
  );
}
