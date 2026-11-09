import { FlaskConical } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card, Notice, PageBand, PageContent, SectionHeading } from "@/components/ui";
import { getDatabase } from "@/db/database";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { formatDate } from "@/lib/dates";
import { getTestPlanAccess } from "@/lib/plan-access";
import { PLAN_UNITS } from "@/lib/plan-units";
import { SITE_NAME } from "@/lib/site";
import type { ExerciseWeek } from "@/lib/safety/types";
import {
  TEST_PROFILES,
  type TestProfile,
} from "@/lib/test-mode/test-profiles";
import { getActivePlan, type ActivePlan } from "@/lib/test-plans";
import { WORDING } from "@/lib/wording";

import { BuildForm } from "./build-form";
import { StartOver } from "./start-over";

export const metadata: Metadata = {
  title: `${WORDING.testPlans.heading} | ${SITE_NAME}`,
};

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 border-t border-line py-1.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function ProfileDetails({ profile }: { profile: TestProfile }) {
  const { profile: labels } = WORDING;
  const list = (items: readonly string[]) =>
    items.length > 0 ? items.join(", ") : WORDING.testPlans.none;

  return (
    <>
      <p className="text-muted">{WORDING.testPlans.profileLabel}</p>
      <h2 className="mt-1 text-xl font-semibold">{labels.goals[profile.goal]}</h2>
      <dl className="mt-3">
        <Detail
          label={labels.fitnessLevelLabel}
          value={labels.fitnessLevels[profile.fitnessLevel]}
        />
        <Detail label={labels.ageLabel} value={profile.age} />
        <Detail
          label={labels.heightLabel}
          value={`${profile.heightCm} ${PLAN_UNITS.heightCm}`}
        />
        <Detail
          label={labels.weightLabel}
          value={`${profile.weightKg} ${PLAN_UNITS.weightKg}`}
        />
        <Detail
          label={WORDING.testPlans.allergiesLabel}
          value={list(profile.allergies)}
        />
        <Detail
          label={WORDING.testPlans.restrictionsLabel}
          value={list(profile.dietaryRestrictions)}
        />
      </dl>
    </>
  );
}

function aerobicMinutes(week: ExerciseWeek): number {
  return week.days
    .flatMap((day) => day.aerobic)
    .reduce((total, item) => total + item.minutes, 0);
}

function PlanSummary({ plan }: { plan: ActivePlan }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card accent="coral">
        <ProfileDetails profile={plan.profile} />
      </Card>
      <Card accent="teal" className="lg:col-span-2">
        <SectionHeading icon={FlaskConical} tone="teal">
          {WORDING.testPlans.currentHeading}
        </SectionHeading>
        <p className="mt-3 text-muted">
          {WORDING.testPlans.startedLabel}: {formatDate(plan.startDate)}
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {plan.exercise.weeks.map((week, index) => (
            <div key={index} className="rounded-xl border border-line p-3">
              <h3 className="font-semibold">
                {WORDING.testPlans.weekLabel} {index + 1}
              </h3>
              <dl className="mt-1">
                <Detail
                  label={PLAN_UNITS.aerobicMinutes}
                  value={aerobicMinutes(week)}
                />
                <Detail
                  label={PLAN_UNITS.strengthDays}
                  value={week.days.filter((day) => day.strength.length > 0).length}
                />
              </dl>
            </div>
          ))}
        </div>
        <div className="mt-5">
          <StartOver />
        </div>
      </Card>
    </div>
  );
}

async function TestPlansContent() {
  const account = await requireAccountWithProfile();
  const db = getDatabase();

  const access = getTestPlanAccess(db, account.id);
  if (access.status === "answers-missing") redirect("/profile");
  if (access.status !== "available") {
    return (
      <Card>
        <Notice>{WORDING.eligibility.noPlan}</Notice>
      </Card>
    );
  }

  const hidesWeightLoss = access.hiddenGoals.includes("weight-loss");
  const plan = getActivePlan(db, account.id);
  const planIsHidden = plan !== null && access.hiddenGoals.includes(plan.profile.goal);
  const profiles = TEST_PROFILES.filter(
    (profile) => !access.hiddenGoals.includes(profile.goal),
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <Notice>{WORDING.testPlans.demonstrationNotice}</Notice>
        <Notice>{WORDING.testPlans.testModeNotice}</Notice>
        {hidesWeightLoss ? (
          <Notice>{WORDING.eligibility.noWeightLossPlan}</Notice>
        ) : null}
      </Card>

      {plan && !planIsHidden ? <PlanSummary plan={plan} /> : null}
      {planIsHidden ? (
        <Card>
          <StartOver />
        </Card>
      ) : null}
      {!plan ? (
        <BuildForm
          profiles={profiles.map((profile) => ({
            key: profile.key,
            details: <ProfileDetails profile={profile} />,
          }))}
        />
      ) : null}
    </div>
  );
}

export default function TestPlansPage() {
  return (
    <main>
      <PageBand icon={FlaskConical} title={WORDING.testPlans.heading} />
      <PageContent>
        <Suspense fallback={null}>
          <TestPlansContent />
        </Suspense>
      </PageContent>
    </main>
  );
}
