import type { Metadata } from "next";
import { Suspense } from "react";

import { getDatabase } from "@/db/database";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { formatDate, localDate } from "@/lib/dates";
import { SITE_NAME } from "@/lib/site";
import { getHistory } from "@/lib/tracking";
import { WORDING } from "@/lib/wording";

export const metadata: Metadata = {
  title: `${WORDING.history.heading} | ${SITE_NAME}`,
};

function NameList({ heading, names }: { heading: string; names: string[] }) {
  if (names.length === 0) return null;

  return (
    <div className="mt-3">
      <h3 className="font-medium">{heading}</h3>
      <ul className="mt-1 list-inside list-disc">
        {names.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

async function HistoryContent() {
  const account = await requireAccountWithProfile();
  const days = getHistory(getDatabase(), account.id, localDate());

  if (days.length === 0) {
    return <p className="mt-6 opacity-80">{WORDING.history.empty}</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      {days.map((day) => (
        <section
          key={day.date}
          className="border-t border-foreground/15 pt-4"
        >
          <h2 className="text-xl font-semibold">{formatDate(day.date)}</h2>
          <NameList
            heading={WORDING.history.exercisesHeading}
            names={day.exercises}
          />
          <NameList heading={WORDING.history.mealsHeading} names={day.meals} />
          {day.note !== null ? (
            <div className="mt-3">
              <h3 className="font-medium">{WORDING.history.noteHeading}</h3>
              <p className="mt-1 break-words whitespace-pre-wrap">{day.note}</p>
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.history.heading}
      </h1>
      <Suspense fallback={null}>
        <HistoryContent />
      </Suspense>
    </main>
  );
}
