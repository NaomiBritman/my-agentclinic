import { History } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";

import { Card, helpClasses, PageBand, PageContent } from "@/components/ui";
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
    <div className="mt-4">
      <h3 className="font-semibold text-chip-teal-ink">{heading}</h3>
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
    return (
      <Card>
        <p className={helpClasses}>{WORDING.history.empty}</p>
      </Card>
    );
  }

  return (
    <div className="grid items-start gap-6 md:grid-cols-2">
      {days.map((day) => (
        <Card key={day.date} accent="coral">
          <section>
            <h2 className="text-xl font-semibold">{formatDate(day.date)}</h2>
            <NameList
              heading={WORDING.history.exercisesHeading}
              names={day.exercises}
            />
            <NameList
              heading={WORDING.history.mealsHeading}
              names={day.meals}
            />
            {day.note !== null ? (
              <div className="mt-4">
                <h3 className="font-semibold text-chip-teal-ink">
                  {WORDING.history.noteHeading}
                </h3>
                <p className="mt-1 break-words whitespace-pre-wrap">{day.note}</p>
              </div>
            ) : null}
          </section>
        </Card>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <main>
      <PageBand icon={History} title={WORDING.history.heading} />
      <PageContent>
        <Suspense fallback={null}>
          <HistoryContent />
        </Suspense>
      </PageContent>
    </main>
  );
}
