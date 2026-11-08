import type { Metadata } from "next";
import { Suspense } from "react";

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
import { TrackingList } from "./tracking-list";

export const metadata: Metadata = {
  title: `${WORDING.today.heading} | ${SITE_NAME}`,
};

async function TodayContent() {
  const account = await requireAccountWithProfile();

  const db = getDatabase();
  const date = localDate();
  const marks = getDayMarks(db, account.id, date);

  return (
    <>
      <p className="mt-1 opacity-80">{formatDate(date)}</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">
          {WORDING.today.exercisesHeading}
        </h2>
        <p className="mt-1 text-sm opacity-80">{WORDING.today.exerciseLabel}</p>
        <TrackingList
          itemType="exercise"
          items={SAMPLE_EXERCISES}
          marked={[...marks.exercises]}
        />
        <p role="status" className="mt-2">
          {exerciseCompletionMessage(marks.exercises)}
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">{WORDING.today.menuHeading}</h2>
        <p className="mt-1 text-sm opacity-80">{WORDING.today.menuLabel}</p>
        <TrackingList
          itemType="meal"
          items={SAMPLE_MEALS}
          marked={[...marks.meals]}
        />
      </section>

      {/* The key starts a fresh form if the page stays open into a new day. */}
      <NoteForm
        key={date}
        initial={getNote(db, account.id, date)}
        maxLength={NOTE_MAX_LENGTH}
      />
    </>
  );
}

export default function TodayPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {WORDING.today.heading}
      </h1>
      <Suspense fallback={null}>
        <TodayContent />
      </Suspense>
    </main>
  );
}
