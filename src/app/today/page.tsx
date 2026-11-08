import type { Metadata } from "next";
import { Suspense } from "react";

import { requireAccountWithProfile } from "@/lib/auth-server";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

export const metadata: Metadata = {
  title: `${WORDING.today.heading} | ${SITE_NAME}`,
};

async function TodayContent() {
  await requireAccountWithProfile();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.today.heading}
      </h1>
      <p className="mt-3 opacity-80">{WORDING.today.placeholder}</p>
    </>
  );
}

export default function TodayPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Suspense fallback={null}>
        <TodayContent />
      </Suspense>
    </main>
  );
}
