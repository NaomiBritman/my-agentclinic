import { CalendarCheck, Dumbbell, NotebookPen, Salad } from "lucide-react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  Card,
  helpClasses,
  IconChip,
  PageBand,
  PageContent,
  SectionHeading,
} from "@/components/ui";
import { getDatabase } from "@/db/database";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { formatDate, localDate } from "@/lib/dates";
import { SAMPLE_EXERCISES, SAMPLE_MEALS } from "@/lib/samples";
import { SITE_NAME } from "@/lib/site";
import {
  exerciseCompletionMessage,
  getDayMarks,
  getNote,
  NOTE_MAX_LENGTH,
} from "@/lib/tracking";
import { WORDING } from "@/lib/wording";

import { NoteForm } from "./note-form";
import { ScrollToHash } from "./scroll-to-hash";
import { TrackingList } from "./tracking-list";

export const metadata: Metadata = {
  title: `${WORDING.today.heading} | ${SITE_NAME}`,
};

async function TodayDate() {
  await connection();
  return <p className="mt-4 text-lg">{formatDate(localDate())}</p>;
}

async function TodayContent() {
  const account = await requireAccountWithProfile();

  const db = getDatabase();
  const date = localDate();
  const marks = getDayMarks(db, account.id, date);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ScrollToHash />
      <Card accent="coral">
        <section id="exercises" className="scroll-mt-6">
          <SectionHeading icon={Dumbbell} tone="coral">
            {WORDING.today.exercisesHeading}
          </SectionHeading>
          <p className={`${helpClasses} mt-3`}>{WORDING.today.exerciseLabel}</p>
          <TrackingList
            itemType="exercise"
            items={SAMPLE_EXERCISES}
            marked={[...marks.exercises]}
          />
          <p role="status" className="mt-4 font-medium">
            {exerciseCompletionMessage(marks.exercises)}
          </p>
        </section>
      </Card>

      <Card accent="teal">
        <section id="menu" className="scroll-mt-6">
          <SectionHeading icon={Salad} tone="teal">
            {WORDING.today.menuHeading}
          </SectionHeading>
          <p className={`${helpClasses} mt-3`}>{WORDING.today.menuLabel}</p>
          <TrackingList
            itemType="meal"
            items={SAMPLE_MEALS}
            marked={[...marks.meals]}
          />
        </section>
      </Card>

      <Card accent="yellow" className="lg:col-span-2">
        <div className="flex items-start gap-3">
          <div className="hidden sm:block">
            <IconChip icon={NotebookPen} tone="teal" />
          </div>
          <div className="min-w-0 flex-1">
            {/* The key starts a fresh form if the page stays open into a new day. */}
            <NoteForm
              key={date}
              initial={getNote(db, account.id, date)}
              maxLength={NOTE_MAX_LENGTH}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function TodayPage() {
  return (
    <main>
      <PageBand icon={CalendarCheck} title={WORDING.today.heading}>
        <Suspense fallback={null}>
          <TodayDate />
        </Suspense>
      </PageBand>
      <PageContent>
        <Suspense fallback={null}>
          <TodayContent />
        </Suspense>
      </PageContent>
    </main>
  );
}
