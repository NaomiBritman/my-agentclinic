import { and, eq, like } from "drizzle-orm";

import type { AppDatabase } from "@/db/database";
import { planLoadMark, trackingMark } from "@/db/schema";

import { getTestPlanAccess } from "./plan-access";
import {
  planKeyPrefix,
  planPosition,
  workOutWeeks,
  type PlanPosition,
  type PlanProgress,
  type WorkedOutWeek,
} from "./plan-days";
import { getActivePlan, type ActivePlan } from "./test-plans";

/** The ticks and marks that decide a plan's amounts. The account comes from the session. */
export function getPlanProgress(
  db: AppDatabase,
  accountId: string,
  planId: string,
): PlanProgress {
  const ticks = db
    .select({ date: trackingMark.date })
    .from(trackingMark)
    .where(
      and(
        eq(trackingMark.userId, accountId),
        eq(trackingMark.itemType, "exercise"),
        like(trackingMark.itemKey, `${planKeyPrefix(planId)}%`),
      ),
    )
    .all();

  const loadMarks = db
    .select({
      exerciseKey: planLoadMark.exerciseKey,
      date: planLoadMark.date,
    })
    .from(planLoadMark)
    .where(
      and(eq(planLoadMark.userId, accountId), eq(planLoadMark.planId, planId)),
    )
    .all();

  return {
    exerciseTickDates: [...new Set(ticks.map(({ date }) => date))],
    loadMarks,
  };
}

export function setLoadMark(
  db: AppDatabase,
  accountId: string,
  planId: string,
  exerciseKey: string,
  date: string,
  marked: boolean,
): void {
  if (marked) {
    db.insert(planLoadMark)
      .values({ userId: accountId, planId, exerciseKey, date })
      .onConflictDoNothing()
      .run();
    return;
  }

  db.delete(planLoadMark)
    .where(
      and(
        eq(planLoadMark.userId, accountId),
        eq(planLoadMark.planId, planId),
        eq(planLoadMark.exerciseKey, exerciseKey),
        eq(planLoadMark.date, date),
      ),
    )
    .run();
}

export type TodayPlanState =
  | { kind: "answers-missing" }
  | { kind: "no-plan-allowed" }
  | { kind: "plan-hidden" }
  | { kind: "choose" }
  | { kind: "not-shown" }
  | {
      kind: "plan";
      plan: ActivePlan;
      weeks: WorkedOutWeek[];
      progress: PlanProgress;
      position: PlanPosition;
    };

/** What `/today` may show one account. All access rules are applied here. */
export function getTodayPlanState(
  db: AppDatabase,
  accountId: string,
  today: string,
): TodayPlanState {
  const access = getTestPlanAccess(db, accountId);
  if (access.status === "no-plan") return { kind: "no-plan-allowed" };
  if (access.status !== "available") return { kind: "answers-missing" };

  const plan = getActivePlan(db, accountId);
  if (!plan) return { kind: "choose" };
  if (access.hiddenGoals.includes(plan.profile.goal)) {
    return { kind: "plan-hidden" };
  }

  const progress = getPlanProgress(db, accountId, plan.id);
  const weeks = workOutWeeks({
    month: plan.exercise,
    level: plan.profile.fitnessLevel,
    startDate: plan.startDate,
    today,
    progress,
  });
  if (!weeks) return { kind: "not-shown" };

  return {
    kind: "plan",
    plan,
    weeks,
    progress,
    position: planPosition(plan.startDate, today),
  };
}
