import { ChevronLeft, ChevronRight, Dumbbell, Salad } from "lucide-react";
import Link from "next/link";

import {
  Card,
  helpClasses,
  Notice,
  secondaryButtonClasses,
  SectionHeading,
} from "@/components/ui";
import { formatDate } from "@/lib/dates";
import {
  DAYS_IN_PLAN,
  type AmountChange,
  type PlanDay,
  type PlanExerciseItem,
} from "@/lib/plan-days";
import {
  formatCalories,
  formatMinutes,
  formatStrength,
  PLAN_UNITS,
} from "@/lib/plan-units";
import type { DayMarks } from "@/lib/tracking";
import { WORDING } from "@/lib/wording";

import { PlanTick } from "./plan-tick";

const { daily } = WORDING;

function changeText(change: AmountChange): string | null {
  if (change === "increased") return daily.increasedFromLastWeek;
  if (change === "same") return daily.sameAsLastWeek;
  return null;
}

function exerciseSummary(item: PlanExerciseItem): string {
  if (item.kind === "aerobic") return formatMinutes(item.minutes);
  const amount = formatStrength(item.sets, item.repetitions, item.loadKg);
  const change = changeText(item.change);
  return change ? `${amount}. ${change}` : amount;
}

export function DayLinks({
  day,
  isToday,
  showBackToToday,
}: {
  day: number | null;
  isToday: boolean;
  showBackToToday: boolean;
}) {
  return (
    <nav
      aria-label={daily.planDaysLabel}
      className="flex flex-col gap-2 lg:flex-row lg:flex-wrap"
    >
      {day !== null ? (
        <div className="flex gap-2">
          {day > 1 ? (
            <Link
              href={`/today?day=${day - 1}`}
              className={`${secondaryButtonClasses} px-3! lg:px-4!`}
            >
              <ChevronLeft aria-hidden className="size-5 shrink-0" />
              {daily.previousDay}
            </Link>
          ) : null}
          {day < DAYS_IN_PLAN ? (
            <Link
              href={`/today?day=${day + 1}`}
              className={`${secondaryButtonClasses} px-3! lg:px-4!`}
            >
              {daily.nextDay}
              <ChevronRight aria-hidden className="size-5 shrink-0" />
            </Link>
          ) : null}
        </div>
      ) : null}
      <div className="grid grid-cols-4 gap-2 lg:flex">
        {[1, 2, 3, 4].map((week) => (
          <Link
            key={week}
            href={`/today?day=${(week - 1) * 7 + 1}`}
            className={`${secondaryButtonClasses} px-1! lg:px-4!`}
          >
            {daily.weekLabel} {week}
          </Link>
        ))}
      </div>
      {showBackToToday && !isToday ? (
        <Link href="/today" className={secondaryButtonClasses}>
          {daily.backToToday}
        </Link>
      ) : null}
    </nav>
  );
}

export function PlanDayView({
  planDay,
  marks,
  loadMarkedKeys,
  isToday,
  isLater,
  canGoToToday,
}: {
  planDay: PlanDay;
  marks: DayMarks;
  loadMarkedKeys: ReadonlySet<string>;
  isToday: boolean;
  isLater: boolean;
  canGoToToday: boolean;
}) {
  const readOnly = !isToday;
  const allExercisesTicked = planDay.exercises.every((item) =>
    marks.exercises.has(item.key),
  );
  const aerobicChange = changeText(planDay.aerobicChange);

  return (
    <>
      <Card className="space-y-3 lg:col-span-2">
        <Notice>{WORDING.testPlans.demonstrationNotice}</Notice>
        <Notice>{WORDING.testPlans.testModeNotice}</Notice>
        <Notice>{daily.menuNotice}</Notice>
      </Card>

      <Card className="space-y-3 lg:col-span-2">
        <div>
          <h2 className="text-xl font-semibold">
            {daily.dayLabel} {planDay.day} {daily.ofLabel} {DAYS_IN_PLAN},{" "}
            {daily.weekLabel} {planDay.week}
          </h2>
          <p className={helpClasses}>{formatDate(planDay.date)}</p>
          {isLater ? <p className={helpClasses}>{daily.laterDays}</p> : null}
          {readOnly && !isLater ? (
            <p className={helpClasses}>{daily.pastDay}</p>
          ) : null}
        </div>
        <DayLinks
          day={planDay.day}
          isToday={isToday}
          showBackToToday={canGoToToday}
        />
      </Card>

      <Card accent="coral">
        <section id="exercises" className="scroll-mt-6">
          <SectionHeading icon={Dumbbell} tone="coral">
            {WORDING.today.exercisesHeading}
          </SectionHeading>
          <p className={`${helpClasses} mt-3`}>
            {PLAN_UNITS.aerobicMinutesThisWeek}: {planDay.aerobicMinutes}
            {aerobicChange ? `. ${aerobicChange}` : ""}
          </p>
          {planDay.exercises.length === 0 ? (
            <p className="mt-4 font-medium">{daily.restDay}</p>
          ) : (
            <>
              <ul className="mt-4 space-y-2">
                {planDay.exercises.map((item) => (
                  <PlanTick
                    key={item.key}
                    itemKey={item.key}
                    title={item.name}
                    summary={exerciseSummary(item)}
                    marked={marks.exercises.has(item.key)}
                    readOnly={readOnly}
                    loadMark={
                      item.kind === "load"
                        ? { marked: loadMarkedKeys.has(item.exerciseKey) }
                        : undefined
                    }
                  />
                ))}
              </ul>
              {isToday ? (
                <p role="status" className="mt-4 font-medium">
                  {allExercisesTicked
                    ? WORDING.today.allExercisesTicked
                    : WORDING.today.someExercisesUnticked}
                </p>
              ) : null}
            </>
          )}
        </section>
      </Card>

      <Card accent="teal">
        <section id="menu" className="scroll-mt-6">
          <SectionHeading icon={Salad} tone="teal">
            {WORDING.today.menuHeading}
          </SectionHeading>
          <p className={`${helpClasses} mt-3`}>
            {daily.totalLabel}: {formatCalories(planDay.totalCalories)} (
            {daily.estimateLabel})
          </p>
          <ul className="mt-4 space-y-2">
            {planDay.meals.map((meal) => (
              <PlanTick
                key={meal.key}
                itemKey={meal.key}
                title={meal.name}
                summary={`${formatCalories(meal.calories)} (${daily.estimateLabel})`}
                marked={marks.meals.has(meal.key)}
                readOnly={readOnly}
              >
                <p className="text-muted">
                  {daily.portionsLabel} ({daily.estimateLabel}):
                </p>
                <ul className="mt-1 list-inside list-disc">
                  {meal.ingredients.map((ingredient, index) => (
                    <li key={index} className="break-words">
                      {ingredient.name}: {ingredient.portion}
                    </li>
                  ))}
                </ul>
              </PlanTick>
            ))}
          </ul>
        </section>
      </Card>
    </>
  );
}
