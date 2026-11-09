import { describe, expect, test } from "vitest";

import { validExerciseMonth, validMenu } from "./ai/fixtures";
import { addDays, daysBetween } from "./dates";
import {
  aerobicMinutesOf,
  buildPlanDay,
  DAYS_IN_PLAN,
  planPosition,
  raisedLoad,
  weekdayOfDay,
  weekOfDay,
  workOutWeeks,
  type PlanProgress,
} from "./plan-days";
import { formatCalories, formatMinutes, formatStrength } from "./plan-units";
import { TEST_PROFILES } from "./test-mode/test-profiles";

const [testA, testB] = TEST_PROFILES;
const START = "2026-03-02";
const NOTHING: PlanProgress = { exerciseTickDates: [], loadMarks: [] };
const LOADED = "goblet-squats-intermediate";

const dateOfDay = (day: number) => addDays(START, day - 1);

function worked(
  today: string,
  progress: PlanProgress = NOTHING,
  profile = testB,
) {
  return workOutWeeks({
    month: validExerciseMonth(profile),
    level: profile.fitnessLevel,
    startDate: START,
    today,
    progress,
  });
}

function loadOf(week: { days: { strength: { exerciseKey: string; loadKg: number | null }[] }[] }, key: string) {
  return week.days[0].strength.find((item) => item.exerciseKey === key)?.loadKg;
}

describe("dates", () => {
  test("whole days are counted across months and clock changes", () => {
    expect(daysBetween("2026-03-30", "2026-04-02")).toBe(3);
    expect(addDays("2026-03-28", 4)).toBe("2026-04-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(daysBetween("2026-03-01", addDays("2026-03-01", 200))).toBe(200);
  });
});

describe("the day and week of a plan", () => {
  test("the start date is day one", () => {
    expect(planPosition(START, START)).toEqual({ status: "active", day: 1 });
  });

  test("day 28 is the last day, and the next date ends the plan", () => {
    expect(planPosition(START, dateOfDay(28))).toEqual({ status: "active", day: 28 });
    expect(planPosition(START, dateOfDay(29))).toEqual({ status: "ended" });
  });

  test("a clock set before the start date doesn't count as a plan day", () => {
    expect(planPosition(START, addDays(START, -1))).toEqual({ status: "before-start" });
  });

  test("all 28 days map to the right week and repeating menu day", () => {
    const seen = Array.from({ length: DAYS_IN_PLAN }, (_unused, index) => {
      const day = index + 1;
      return [day, weekOfDay(day), weekdayOfDay(day)];
    });

    expect(seen.slice(0, 8)).toEqual([
      [1, 1, 1],
      [2, 1, 2],
      [3, 1, 3],
      [4, 1, 4],
      [5, 1, 5],
      [6, 1, 6],
      [7, 1, 7],
      [8, 2, 1],
    ]);
    expect(seen[27]).toEqual([28, 4, 7]);
    for (const [day, week, weekday] of seen) {
      expect(week).toBe(Math.floor((day - 1) / 7) + 1);
      expect(weekday).toBeGreaterThanOrEqual(1);
      expect(weekday).toBeLessThanOrEqual(7);
    }
  });

  test("every day of the plan works out, on every date of the plan", () => {
    for (let today = 1; today <= 30; today++) {
      const weeks = worked(dateOfDay(today));
      expect(weeks).not.toBeNull();
      for (let day = 1; day <= DAYS_IN_PLAN; day++) {
        const planDay = buildPlanDay({
          planId: "p",
          startDate: START,
          weeks: weeks!,
          menu: validMenu(testB),
          day,
        });
        expect(planDay.date).toBe(dateOfDay(day));
        expect(planDay.week).toBe(weekOfDay(day));
        expect(planDay.meals.length).toBeGreaterThan(0);
      }
    }
  });

  test("the menu repeats each week", () => {
    const menu = validMenu(testB);
    menu.days[1].meals[0].name = "Only on the second day of each week";
    const weeks = worked(START)!;
    const mealOn = (day: number) =>
      buildPlanDay({ planId: "p", startDate: START, weeks, menu, day }).meals[0].name;

    for (const day of [2, 9, 16, 23]) {
      expect(mealOn(day)).toBe("Only on the second day of each week");
    }
    expect(mealOn(3)).not.toBe("Only on the second day of each week");
  });
});

describe("holding after a week with no exercise ticked", () => {
  const steps = (today: string, progress: PlanProgress = NOTHING) =>
    worked(today, progress)!.map(({ step }) => step);

  test("week one is always the first step", () => {
    expect(steps(START)[0]).toBe(1);
  });

  test("a tick in week one moves week two up one step", () => {
    const progress = { exerciseTickDates: [dateOfDay(3)], loadMarks: [] };
    expect(steps(dateOfDay(8), progress).slice(0, 2)).toEqual([1, 2]);
  });

  test("no tick in week one holds week two at the same step", () => {
    expect(steps(dateOfDay(8)).slice(0, 2)).toEqual([1, 1]);
  });

  test("later steps shift, so each rise is still at most one step", () => {
    const progress = { exerciseTickDates: [dateOfDay(9)], loadMarks: [] };
    expect(steps(dateOfDay(22), progress)).toEqual([1, 1, 2, 2]);
  });

  test("a plan ticked every week reaches the fourth step", () => {
    const progress = {
      exerciseTickDates: [dateOfDay(1), dateOfDay(8), dateOfDay(15)],
      loadMarks: [],
    };
    expect(steps(dateOfDay(22), progress)).toEqual([1, 2, 3, 4]);
  });

  test("a tick on the last day of a week counts, and the first of the next doesn't", () => {
    expect(
      steps(dateOfDay(8), { exerciseTickDates: [dateOfDay(7)], loadMarks: [] })[1],
    ).toBe(2);
    expect(
      steps(dateOfDay(8), { exerciseTickDates: [dateOfDay(8)], loadMarks: [] })[1],
    ).toBe(1);
  });

  test("weeks still to come assume one step each, without changing past weeks", () => {
    expect(steps(START)).toEqual([1, 2, 3, 4]);
    expect(steps(dateOfDay(8))).toEqual([1, 1, 2, 3]);
  });

  test("the amounts really repeat in a held week", () => {
    const weeks = worked(dateOfDay(8))!;
    expect(aerobicMinutesOf(weeks[1].week)).toBe(aerobicMinutesOf(weeks[0].week));
    const ticked = worked(dateOfDay(8), {
      exerciseTickDates: [dateOfDay(1)],
      loadMarks: [],
    })!;
    expect(aerobicMinutesOf(ticked[1].week)).toBeGreaterThan(
      aerobicMinutesOf(ticked[0].week),
    );
  });

  test("a Beginner starts at 150 aerobic minutes", () => {
    expect(aerobicMinutesOf(worked(START, NOTHING, testA)![0].week)).toBe(150);
  });
});

describe("load", () => {
  const mark = (day: number, exerciseKey = LOADED) => ({
    exerciseKey,
    date: dateOfDay(day),
  });
  const withMarks = (...days: number[]): PlanProgress => ({
    exerciseTickDates: days.map(dateOfDay),
    loadMarks: days.map((day) => mark(day)),
  });

  test("with no mark, load stays at the starting amount all month", () => {
    const weeks = worked(dateOfDay(28), {
      exerciseTickDates: [dateOfDay(1), dateOfDay(8), dateOfDay(15)],
      loadMarks: [],
    })!;
    for (const { week } of weeks) expect(loadOf(week, LOADED)).toBe(6);
  });

  test("a mark raises load from the next week, not the same week", () => {
    const weeks = worked(dateOfDay(8), withMarks(3))!;
    expect(loadOf(weeks[0].week, LOADED)).toBe(6);
    expect(loadOf(weeks[1].week, LOADED)).toBe(6.3);
  });

  test("only the marked exercise rises", () => {
    const weeks = worked(dateOfDay(8), withMarks(3))!;
    expect(loadOf(weeks[1].week, "dumbbell-rows-intermediate")).toBe(6);
  });

  test("several marks in a week give only one rise", () => {
    const weeks = worked(dateOfDay(8), withMarks(1, 2, 3))!;
    expect(loadOf(weeks[1].week, LOADED)).toBe(6.3);
  });

  test("a load keeps its rise in later weeks", () => {
    const weeks = worked(dateOfDay(28), withMarks(3))!;
    expect(weeks.slice(1).map(({ week }) => loadOf(week, LOADED))).toEqual([
      6.3, 6.3, 6.3,
    ]);
  });

  test("marks in each week build up, rounded down", () => {
    const weeks = worked(dateOfDay(28), withMarks(3, 10, 17))!;
    expect(weeks.map(({ week }) => loadOf(week, LOADED))).toEqual([6, 6.3, 6.6, 6.9]);
  });

  test.each([0.1, 1, 6, 6.3, 6.6, 6.9, 7.2, 12, 12.6, 13.2, 19.9, 100])(
    "rounding from %f kg never passes the 5%% limit",
    (load) => {
      const raised = raisedLoad(load);
      expect(raised).toBeLessThanOrEqual(load * 1.05 + 1e-9);
      expect(raised).toBeGreaterThanOrEqual(load);
    },
  );

  test("a mark for an exercise with no load changes nothing", () => {
    const weeks = worked(dateOfDay(8), {
      exerciseTickDates: [dateOfDay(1)],
      loadMarks: [mark(1, "knee-push-ups")],
    });
    expect(weeks).not.toBeNull();
    expect(loadOf(weeks![1].week, "knee-push-ups")).toBeNull();
  });
});

describe("worked out weeks are checked again", () => {
  test("every combination of ticks and marks passes the next week rules", () => {
    for (const profile of TEST_PROFILES) {
      for (let pattern = 0; pattern < 8; pattern++) {
        const days = [1, 8, 15].filter((_day, bit) => pattern & (1 << bit));
        const key = profile.fitnessLevel === "experienced"
          ? "goblet-squats-experienced"
          : LOADED;
        expect(
          worked(
            dateOfDay(28),
            {
              exerciseTickDates: days.map(dateOfDay),
              loadMarks: days.map((day) => ({ exerciseKey: key, date: dateOfDay(day) })),
            },
            profile,
          ),
        ).not.toBeNull();
      }
    }
  });

  test.each([
    [
      "a first week over the limit",
      (month: ReturnType<typeof validExerciseMonth>) => {
        month.weeks[0].days[0].aerobic[0].minutes = 400;
      },
    ],
    [
      "a later week over the weekly increase",
      (month: ReturnType<typeof validExerciseMonth>) => {
        month.weeks[2].days[0].aerobic[0].minutes = 300;
      },
    ],
    [
      "a stored load rise",
      (month: ReturnType<typeof validExerciseMonth>) => {
        for (const day of month.weeks[1].days) {
          for (const item of day.strength) {
            if (item.exerciseKey === "knee-push-ups") item.repetitions = 30;
          }
        }
      },
    ],
  ])("%s means no plan is shown", (_name, change) => {
    const month = validExerciseMonth(testB);
    change(month);
    expect(
      workOutWeeks({
        month,
        level: testB.fitnessLevel,
        startDate: START,
        today: START,
        progress: NOTHING,
      }),
    ).toBeNull();
  });

  test("a plan without exactly four weeks means no plan is shown", () => {
    const month = validExerciseMonth(testB);
    expect(
      workOutWeeks({
        month: { weeks: month.weeks.slice(0, 3) },
        level: testB.fitnessLevel,
        startDate: START,
        today: START,
        progress: NOTHING,
      }),
    ).toBeNull();
  });
});

describe("a plan day", () => {
  function day(number: number, progress: PlanProgress = NOTHING, today = dateOfDay(number)) {
    return buildPlanDay({
      planId: "plan-1",
      startDate: START,
      weeks: worked(today, progress)!,
      menu: validMenu(testB),
      day: number,
    });
  }

  test("shows the exercises scheduled that day, with names from the catalog", () => {
    const planDay = day(1);
    expect(planDay.exercises.map((item) => item.name)).toEqual([
      "Brisk walking",
      "Knee push-ups",
      "Goblet squats",
      "Dumbbell rows",
    ]);
    expect(planDay.exercises[0]).toMatchObject({ kind: "aerobic", minutes: 150 });
    expect(planDay.exercises[2]).toMatchObject({
      kind: "load",
      sets: 3,
      repetitions: 8,
      loadKg: 6,
    });
  });

  test("a day with nothing scheduled has no exercises, and still has meals", () => {
    const planDay = day(4);
    expect(planDay.exercises).toEqual([]);
    expect(planDay.meals).toHaveLength(3);
  });

  test("adds up the day's estimated calories", () => {
    expect(day(1).totalCalories).toBe(1800);
  });

  test("week one has no change to report", () => {
    const planDay = day(1);
    expect(planDay.aerobicChange).toBeNull();
    expect(planDay.exercises[1]).toMatchObject({ change: null });
  });

  test("a week that rose says so, and a held week says it's the same", () => {
    const risen = day(8, { exerciseTickDates: [dateOfDay(1)], loadMarks: [] });
    expect(risen.aerobicChange).toBe("increased");
    expect(risen.exercises.find((item) => item.kind === "no-load")).toMatchObject({
      change: "increased",
    });
    expect(risen.exercises.find((item) => item.kind === "load")).toMatchObject({
      change: "same",
    });

    const held = day(8);
    expect(held.aerobicChange).toBe("same");
    expect(held.exercises.find((item) => item.kind === "no-load")).toMatchObject({
      change: "same",
    });
  });

  test("a marked load says it increased", () => {
    const planDay = day(8, {
      exerciseTickDates: [dateOfDay(1)],
      loadMarks: [{ exerciseKey: LOADED, date: dateOfDay(1) }],
    });
    expect(
      planDay.exercises.find((item) => item.exerciseKey === LOADED),
    ).toMatchObject({ change: "increased", loadKg: 6.3 });
  });

  test("keys belong to the plan, and are unique within a day", () => {
    const planDay = day(1);
    const keys = [...planDay.exercises, ...planDay.meals].map((item) => item.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const key of keys) expect(key.startsWith("plan:plan-1:")).toBe(true);
  });
});

describe("amounts as text", () => {
  test("exercises show minutes, or sets and repetitions, and a load if any", () => {
    expect(formatMinutes(30)).toBe("30 min");
    expect(formatStrength(2, 8, null)).toBe("2 sets of 8 repetitions");
    expect(formatStrength(3, 8, 6.3)).toBe("3 sets of 8 repetitions at 6.3 kg");
  });

  test("calories are shown as approximate", () => {
    expect(formatCalories(612.4)).toBe("About 612 kcal");
    expect(formatCalories(1800)).toBe("About 1,800 kcal");
  });
});
