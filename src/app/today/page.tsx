import { CalendarCheck, Dumbbell, NotebookPen, Salad } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import {
  buttonClasses,
  Card,
  helpClasses,
  IconChip,
  Notice,
  PageBand,
  PageContent,
  SectionHeading,
} from "@/components/ui";
import { getDatabase } from "@/db/database";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { formatDate, localDate } from "@/lib/dates";
import { buildPlanDay, isPlanDay } from "@/lib/plan-days";
import { getTodayPlanState, type TodayPlanState } from "@/lib/plan-tracking";
import { SAMPLE_EXERCISES, SAMPLE_MEALS } from "@/lib/samples";
import { SITE_NAME } from "@/lib/site";
import {
  exerciseCompletionMessage,
  getDayMarks,
  getNote,
  NOTE_MAX_LENGTH,
  type DayMarks,
} from "@/lib/tracking";
import { WORDING } from "@/lib/wording";

import { NoteForm } from "./note-form";
import { DayLinks, PlanDayView } from "./plan-day-view";
import { ScrollToHash } from "./scroll-to-hash";
import { TrackingList } from "./tracking-list";

export const metadata: Metadata = {
  title: `${WORDING.today.heading} | ${SITE_NAME}`,
};

type PageProps = { searchParams: Promise<{ day?: string | string[] }> };

async function TodayDate() {
  await connection();
  return <p className="mt-4 text-lg">{formatDate(localDate())}</p>;
}

function SampleLists({ marks }: { marks: DayMarks }) {
  return (
    <>
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
    </>
  );
}

/** The message or prompt above the sample lists, when no plan day is shown. */
function NoPlanMessage({ state }: { state: TodayPlanState }) {
  const { daily, eligibility, testPlans } = WORDING;

  const content = (() => {
    switch (state.kind) {
      case "answers-missing":
        return (
          <>
            <p className="font-medium">{daily.answerPrompt}</p>
            <Link href="/profile" className={buttonClasses}>
              {daily.profileLink}
            </Link>
          </>
        );
      case "no-plan-allowed":
        return <Notice>{eligibility.noPlan}</Notice>;
      case "plan-hidden":
        return <Notice>{eligibility.noWeightLossPlan}</Notice>;
      case "not-shown":
        return <Notice>{testPlans.noPlanProduced}</Notice>;
      case "choose":
        return (
          <>
            <p className="font-medium">{daily.choosePrompt}</p>
            <Link href="/test-plans" className={buttonClasses}>
              {testPlans.heading}
            </Link>
          </>
        );
      case "plan":
        return (
          <>
            <p className="font-medium">{daily.monthEnded}</p>
            <div className="flex flex-col gap-3 sm:items-start">
              <Link href="/test-plans" className={buttonClasses}>
                {daily.buildAnother}
              </Link>
              <DayLinks day={null} isToday={false} showBackToToday={false} />
            </div>
          </>
        );
    }
  })();

  return <Card className="space-y-3 lg:col-span-2">{content}</Card>;
}

function NoteCard({ date, initial }: { date: string; initial: string }) {
  return (
    <Card accent="yellow" className="lg:col-span-2">
      <div className="flex items-start gap-3">
        <div className="hidden sm:block">
          <IconChip icon={NotebookPen} tone="teal" />
        </div>
        <div className="min-w-0 flex-1">
          {/* The key starts a fresh form if the page stays open into a new day. */}
          <NoteForm key={date} initial={initial} maxLength={NOTE_MAX_LENGTH} />
        </div>
      </div>
    </Card>
  );
}

function requestedDay(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d{1,2}$/.test(value)) return null;
  const day = Number(value);
  return isPlanDay(day) ? day : null;
}

async function TodayContent({ searchParams }: PageProps) {
  const account = await requireAccountWithProfile();

  const db = getDatabase();
  const date = localDate();
  const state = getTodayPlanState(db, account.id, date);
  const note = getNote(db, account.id, date);

  const { day } = await searchParams;
  const requested = requestedDay(day);

  let planView = null;
  // The note is always for today, so it only appears beside today.
  let showNote = true;
  if (state.kind === "plan") {
    const { position } = state;
    const todayNumber = position.status === "active" ? position.day : null;
    const shownDay =
      requested ?? todayNumber ?? (position.status === "before-start" ? 1 : null);

    if (shownDay !== null) {
      showNote = shownDay === todayNumber;
      const planDay = buildPlanDay({
        planId: state.plan.id,
        startDate: state.plan.startDate,
        weeks: state.weeks,
        menu: state.plan.menu,
        day: shownDay,
      });
      const shownMarks = getDayMarks(db, account.id, planDay.date);
      const loadMarkedKeys = new Set(
        state.progress.loadMarks
          .filter((mark) => mark.date === planDay.date)
          .map((mark) => mark.exerciseKey),
      );

      planView = (
        <PlanDayView
          planDay={planDay}
          marks={shownMarks}
          loadMarkedKeys={loadMarkedKeys}
          isToday={shownDay === todayNumber}
          isLater={planDay.date > date}
          canGoToToday={position.status === "active"}
        />
      );
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ScrollToHash />
      {planView ?? (
        <>
          <NoPlanMessage state={state} />
          <SampleLists marks={getDayMarks(db, account.id, date)} />
        </>
      )}
      {showNote ? <NoteCard date={date} initial={note} /> : null}
    </div>
  );
}

export default function TodayPage({ searchParams }: PageProps) {
  return (
    <main>
      <PageBand icon={CalendarCheck} title={WORDING.today.heading}>
        <Suspense fallback={null}>
          <TodayDate />
        </Suspense>
      </PageBand>
      <PageContent>
        <Suspense fallback={null}>
          <TodayContent searchParams={searchParams} />
        </Suspense>
      </PageContent>
    </main>
  );
}
