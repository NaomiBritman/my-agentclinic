"use server";

import { refresh } from "next/cache";

import { getDatabase } from "@/db/database";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { localDate } from "@/lib/dates";
import { buildPlanDay } from "@/lib/plan-days";
import { getTodayPlanState, setLoadMark } from "@/lib/plan-tracking";
import { getDayMarks, setMark } from "@/lib/tracking";

// The account comes from the session and the date from this computer's clock,
// and the item must be on today's plan. Nothing else is taken from the browser.

function findToday(accountId: string) {
  const db = getDatabase();
  const date = localDate();
  const state = getTodayPlanState(db, accountId, date);
  if (state.kind !== "plan" || state.position.status !== "active") return null;

  const day = buildPlanDay({
    planId: state.plan.id,
    startDate: state.plan.startDate,
    weeks: state.weeks,
    menu: state.plan.menu,
    day: state.position.day,
  });
  return { db, date, planId: state.plan.id, day };
}

export async function setPlanMarkAction(
  itemKey: unknown,
  marked: unknown,
): Promise<void> {
  const account = await requireAccountWithProfile();
  if (typeof marked !== "boolean") return;

  const today = findToday(account.id);
  if (!today) return;
  const { db, date, planId, day } = today;

  const exercise = day.exercises.find((item) => item.key === itemKey);
  const meal = day.meals.find((item) => item.key === itemKey);
  const item = exercise ?? meal;
  if (!item) return;

  setMark(
    db,
    account.id,
    date,
    exercise ? "exercise" : "meal",
    { key: item.key, name: item.name },
    marked,
  );

  // A load mark says this exercise was done, so unticking it clears the mark.
  if (exercise?.kind === "load" && !marked) {
    setLoadMark(db, account.id, planId, exercise.exerciseKey, date, false);
  }
  refresh();
}

export async function setLoadMarkAction(
  itemKey: unknown,
  marked: unknown,
): Promise<void> {
  const account = await requireAccountWithProfile();
  if (typeof marked !== "boolean") return;

  const today = findToday(account.id);
  if (!today) return;
  const { db, date, planId, day } = today;

  const exercise = day.exercises.find((item) => item.key === itemKey);
  if (exercise?.kind !== "load") return;
  if (marked && !getDayMarks(db, account.id, date).exercises.has(exercise.key)) {
    return;
  }

  setLoadMark(db, account.id, planId, exercise.exerciseKey, date, marked);
  refresh();
}
