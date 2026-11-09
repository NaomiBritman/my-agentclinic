import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, PageBand, PageContent } from "@/components/ui";
import { getDatabase } from "@/db/database";
import { requireAccount } from "@/lib/auth-server";
import { getEligibilityMessage } from "@/lib/plan-access";
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
        eatingDisorderAnswer: saved.eatingDisorderAnswer ?? "",
        medicalConditionAnswer: saved.medicalConditionAnswer ?? "",
      }
    : {
        age: "",
        heightCm: "",
        weightKg: "",
        fitnessLevel: "",
        goal: "",
        eatingDisorderAnswer: "",
        medicalConditionAnswer: "",
      };

  return (
    <ProfileForm
      initial={initial}
      initialMessage={saved ? getEligibilityMessage(saved) : null}
    />
  );
}

export default function ProfilePage() {
  return (
    <main>
      <PageBand
        icon={ClipboardList}
        title={WORDING.profile.heading}
        width="medium"
      />
      <PageContent width="medium">
        <Card>
          <Suspense fallback={null}>
            <ProfileContent />
          </Suspense>
        </Card>
      </PageContent>
    </main>
  );
}
