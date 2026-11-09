"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState, type ReactNode } from "react";

import { buttonClasses, Card, Notice } from "@/components/ui";
import { WORDING } from "@/lib/wording";

import { buildPlanAction } from "./actions";

export type ProfileCard = {
  key: string;
  details: ReactNode;
};

export function BuildForm({ profiles }: { profiles: ProfileCard[] }) {
  const [state, formAction, pending] = useActionState(buildPlanAction, {
    message: null,
  });

  return (
    <form action={formAction} className="space-y-6">
      {pending ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl bg-chip-teal p-4 font-medium text-chip-teal-ink"
        >
          <LoaderCircle aria-hidden className="size-5 shrink-0 animate-spin" />
          <p>{WORDING.testPlans.loading}</p>
        </div>
      ) : null}
      {state.message && !pending ? <Notice>{state.message}</Notice> : null}

      <div className="grid gap-6 md:grid-cols-3">
        {profiles.map((profile) => (
          <Card key={profile.key} accent="coral" className="flex flex-col">
            <div className="flex-1">{profile.details}</div>
            <button
              type="submit"
              name="testProfileKey"
              value={profile.key}
              disabled={pending}
              className={`${buttonClasses} mt-5 md:w-full`}
            >
              {WORDING.testPlans.buildButton}
            </button>
          </Card>
        ))}
      </div>
    </form>
  );
}
