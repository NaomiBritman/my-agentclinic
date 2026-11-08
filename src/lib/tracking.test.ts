import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { trackingMark, user } from "@/db/schema";
import { createTestDatabase, type TestDatabase } from "@/db/test-database";

import { formatDate, localDate } from "./dates";
import { SAMPLE_EXERCISES, SAMPLE_MEALS } from "./samples";
import {
  exerciseCompletionMessage,
  findSampleItem,
  getDayMarks,
  getHistory,
  getNote,
  NOTE_MAX_LENGTH,
  readNote,
  saveNote,
  setMark,
} from "./tracking";
import { WORDING } from "./wording";

const TODAY = "2026-03-10";
const YESTERDAY = "2026-03-09";
const EARLIER = "2026-03-02";
const ACCOUNT = "account-a";
const OTHER_ACCOUNT = "account-b";

const [WALKING, STRETCHING] = SAMPLE_EXERCISES;
const [BREAKFAST, LUNCH] = SAMPLE_MEALS;

let database: TestDatabase;

beforeEach(() => {
  database = createTestDatabase();
  const now = new Date();
  for (const id of [ACCOUNT, OTHER_ACCOUNT]) {
    database.db
      .insert(user)
      .values({
        id,
        name: "",
        email: `${id}@example.com`,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }
});

afterEach(() => {
  database.cleanup();
});

describe("sample lists", () => {
  test("the lists are the agreed names, with no amounts", () => {
    expect(SAMPLE_EXERCISES.map((item) => item.name)).toEqual([
      "Walking",
      "Stretching",
      "Wall push-ups",
      "Chair squats",
    ]);
    expect(SAMPLE_MEALS.map((item) => item.name)).toEqual([
      "Breakfast",
      "Lunch",
      "Dinner",
      "Snack",
    ]);
  });

  test("only items on the lists can be found", () => {
    expect(findSampleItem("exercise", "walking")?.item).toEqual(WALKING);
    expect(findSampleItem("meal", "lunch")?.item).toEqual(LUNCH);
    expect(findSampleItem("meal", "walking")).toBeNull();
    expect(findSampleItem("exercise", "made-up")).toBeNull();
    expect(findSampleItem("made-up", "walking")).toBeNull();
    expect(findSampleItem(undefined, undefined)).toBeNull();
  });
});

describe("marks", () => {
  test("ticking saves a mark, and unticking removes it", () => {
    const { db } = database;

    setMark(db, ACCOUNT, TODAY, "exercise", WALKING, true);
    expect([...getDayMarks(db, ACCOUNT, TODAY).exercises]).toEqual(["walking"]);

    setMark(db, ACCOUNT, TODAY, "exercise", WALKING, false);
    expect(getDayMarks(db, ACCOUNT, TODAY).exercises.size).toBe(0);
  });

  test("ticking twice keeps one mark", () => {
    const { db } = database;

    setMark(db, ACCOUNT, TODAY, "meal", BREAKFAST, true);
    setMark(db, ACCOUNT, TODAY, "meal", BREAKFAST, true);

    expect(db.select().from(trackingMark).all()).toHaveLength(1);
  });

  test("exercises and meals are kept apart", () => {
    const { db } = database;

    setMark(db, ACCOUNT, TODAY, "exercise", WALKING, true);
    setMark(db, ACCOUNT, TODAY, "meal", BREAKFAST, true);

    const marks = getDayMarks(db, ACCOUNT, TODAY);
    expect([...marks.exercises]).toEqual(["walking"]);
    expect([...marks.meals]).toEqual(["breakfast"]);
  });

  test("a new day starts clear", () => {
    const { db } = database;

    setMark(db, ACCOUNT, YESTERDAY, "exercise", WALKING, true);
    saveNote(db, ACCOUNT, YESTERDAY, "A note");

    const marks = getDayMarks(db, ACCOUNT, TODAY);
    expect(marks.exercises.size).toBe(0);
    expect(marks.meals.size).toBe(0);
    expect(getNote(db, ACCOUNT, TODAY)).toBe("");
  });

  test("one account's marks don't reach another", () => {
    const { db } = database;

    setMark(db, ACCOUNT, TODAY, "exercise", WALKING, true);
    setMark(db, OTHER_ACCOUNT, TODAY, "exercise", WALKING, false);

    expect(getDayMarks(db, OTHER_ACCOUNT, TODAY).exercises.size).toBe(0);
    expect(getDayMarks(db, ACCOUNT, TODAY).exercises.size).toBe(1);
  });
});

describe("completion message", () => {
  test("appears as complete only when every exercise is ticked", () => {
    const all = new Set(SAMPLE_EXERCISES.map((item) => item.key));
    expect(exerciseCompletionMessage(all)).toBe(
      WORDING.today.allExercisesTicked,
    );
  });

  test("uses the neutral message otherwise, including for none", () => {
    expect(exerciseCompletionMessage(new Set())).toBe(
      WORDING.today.someExercisesUnticked,
    );
    expect(exerciseCompletionMessage(new Set(["walking"]))).toBe(
      WORDING.today.someExercisesUnticked,
    );
  });
});

describe("notes", () => {
  test("a note is saved exactly as written, and isn't parsed", () => {
    const { db } = database;
    const text = "  Item 7 🍕, <b>as typed</b> & 'more'\n\n  ";

    saveNote(db, ACCOUNT, TODAY, text);

    expect(getNote(db, ACCOUNT, TODAY)).toBe(text);
  });

  test("saving again replaces the day's note", () => {
    const { db } = database;

    saveNote(db, ACCOUNT, TODAY, "First");
    saveNote(db, ACCOUNT, TODAY, "Second");

    expect(getNote(db, ACCOUNT, TODAY)).toBe("Second");
  });

  test.each(["", "   ", "\n"])("the blank note %j clears the note", (blank) => {
    const { db } = database;

    saveNote(db, ACCOUNT, TODAY, "First");
    saveNote(db, ACCOUNT, TODAY, blank);

    expect(getNote(db, ACCOUNT, TODAY)).toBe("");
    expect(getHistory(db, ACCOUNT, "2026-03-11")).toEqual([]);
  });

  test("one account's note doesn't reach another", () => {
    const { db } = database;

    saveNote(db, ACCOUNT, TODAY, "Mine");

    expect(getNote(db, OTHER_ACCOUNT, TODAY)).toBe("");
  });

  test("text at the length limit is accepted, and text over it is refused", () => {
    expect(readNote("x".repeat(NOTE_MAX_LENGTH))).toEqual({
      ok: true,
      text: "x".repeat(NOTE_MAX_LENGTH),
    });
    expect(readNote("x".repeat(NOTE_MAX_LENGTH + 1))).toEqual({
      ok: false,
      message: WORDING.today.noteTooLong,
    });
  });

  test("browser line endings count as one character each", () => {
    const text = "x\r\n".repeat(NOTE_MAX_LENGTH / 2);

    expect(readNote(text)).toEqual({
      ok: true,
      text: "x\n".repeat(NOTE_MAX_LENGTH / 2),
    });
  });
});

describe("history", () => {
  test("is empty with nothing recorded", () => {
    expect(getHistory(database.db, ACCOUNT, TODAY)).toEqual([]);
  });

  test("shows days newest first, and leaves out today and empty days", () => {
    const { db } = database;

    setMark(db, ACCOUNT, EARLIER, "exercise", WALKING, true);
    setMark(db, ACCOUNT, YESTERDAY, "meal", BREAKFAST, true);
    setMark(db, ACCOUNT, TODAY, "exercise", STRETCHING, true);
    saveNote(db, ACCOUNT, TODAY, "Today's note");

    expect(getHistory(db, ACCOUNT, TODAY).map((day) => day.date)).toEqual([
      YESTERDAY,
      EARLIER,
    ]);
  });

  test("a day with only a note is listed", () => {
    const { db } = database;

    saveNote(db, ACCOUNT, YESTERDAY, "A note");

    expect(getHistory(db, ACCOUNT, TODAY)).toEqual([
      { date: YESTERDAY, exercises: [], meals: [], note: "A note" },
    ]);
  });

  test("a day whose marks were all removed isn't listed", () => {
    const { db } = database;

    setMark(db, ACCOUNT, YESTERDAY, "exercise", WALKING, true);
    setMark(db, ACCOUNT, YESTERDAY, "exercise", WALKING, false);

    expect(getHistory(db, ACCOUNT, TODAY)).toEqual([]);
  });

  test("shows items in list order, whatever order they were ticked", () => {
    const { db } = database;

    setMark(db, ACCOUNT, YESTERDAY, "exercise", STRETCHING, true);
    setMark(db, ACCOUNT, YESTERDAY, "exercise", WALKING, true);

    expect(getHistory(db, ACCOUNT, TODAY)[0].exercises).toEqual([
      "Walking",
      "Stretching",
    ]);
  });

  test("shows the stored name, even for an item no longer on the list", () => {
    const { db } = database;

    db.insert(trackingMark)
      .values({
        userId: ACCOUNT,
        date: YESTERDAY,
        itemType: "exercise",
        itemKey: "old-item",
        itemName: "An older name",
      })
      .run();

    expect(getHistory(db, ACCOUNT, TODAY)[0].exercises).toEqual([
      "An older name",
    ]);
  });

  test("one account's history doesn't reach another", () => {
    const { db } = database;

    setMark(db, ACCOUNT, YESTERDAY, "exercise", WALKING, true);
    saveNote(db, ACCOUNT, YESTERDAY, "Mine");

    expect(getHistory(db, OTHER_ACCOUNT, TODAY)).toEqual([]);
  });
});

describe("dates", () => {
  test("uses the local date, with padding", () => {
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe("2026-01-05");
    expect(localDate(new Date(2026, 11, 31, 0, 0))).toBe("2026-12-31");
  });

  test("formats a stored date without shifting the day", () => {
    expect(formatDate("2026-03-10")).toContain("March 10, 2026");
  });
});
