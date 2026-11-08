import type { Metadata } from "next";
import { Suspense } from "react";

import { requireAccount } from "@/lib/auth-server";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

export const metadata: Metadata = {
  title: `${WORDING.profile.heading} | ${SITE_NAME}`,
};

async function ProfileContent() {
  await requireAccount();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.profile.heading}
      </h1>
      <p className="mt-3 opacity-80">{WORDING.profile.placeholder}</p>
    </>
  );
}

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
