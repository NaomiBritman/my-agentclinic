import type { Metadata } from "next";
import { Suspense } from "react";

import { getDatabase } from "@/db/database";
import { requireAccount } from "@/lib/auth-server";
import type { ProfileFormInput } from "@/lib/profile-validation";
import { getProfile } from "@/lib/profiles";
import { SITE_NAME } from "@/lib/site";
import { WORDING } from "@/lib/wording";

import { ProfileForm } from "./profile-form";

export const metadata: Metadata = {
  title: `${WORDING.profile.heading} | ${SITE_NAME}`,
};

async function ProfileContent() {
  const account = await requireAccount();
  const saved = getProfile(getDatabase(), account.id);

  const initial: ProfileFormInput = saved
    ? {
        age: String(saved.age),
        heightCm: String(saved.heightCm),
        weightKg: String(saved.weightKg),
        fitnessLevel: saved.fitnessLevel,
        goal: saved.goal,
      }
    : { age: "", heightCm: "", weightKg: "", fitnessLevel: "", goal: "" };

  return <ProfileForm initial={initial} />;
}

export default function ProfilePage() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.profile.heading}
      </h1>
      <Suspense fallback={null}>
        <ProfileContent />
      </Suspense>
    </main>
  );
}
