import { and, eq, lt } from "drizzle-orm";

import type { AppDatabase } from "@/db/database";
import { dayNote, trackingMark } from "@/db/schema";

import {
  SAMPLE_EXERCISES,
  sampleItems,
  type ItemType,
  type SampleItem,
} from "./samples";
import { WORDING } from "./wording";

export const NOTE_MAX_LENGTH = 2000;

export type DayMarks = { exercises: Set<string>; meals: Set<string> };

export type HistoryDay = {
  date: string;
  exercises: string[];
  meals: string[];
  note: string | null;
};

export type NoteInput =
  | { ok: true; text: string }
  | { ok: false; message: string };

function isItemType(value: unknown): value is ItemType {
  return value === "exercise" || value === "meal";
}

/** Finds a sample item from untrusted input. Returns null if it isn't one. */
export function findSampleItem(
  itemType: unknown,
  itemKey: unknown,
): { itemType: ItemType; item: SampleItem } | null {
  if (!isItemType(itemType)) return null;
  const item = sampleItems(itemType).find(({ key }) => key === itemKey);
  return item ? { itemType, item } : null;
}

export function setMark(
  db: AppDatabase,
  accountId: string,
  date: string,
  itemType: ItemType,
  item: SampleItem,
  marked: boolean,
): void {
  if (marked) {
    db.insert(trackingMark)
      .values({
        userId: accountId,
        date,
        itemType,
        itemKey: item.key,
        itemName: item.name,
      })
      .onConflictDoNothing()
      .run();
    return;
  }

  db.delete(trackingMark)
    .where(
      and(
        eq(trackingMark.userId, accountId),
        eq(trackingMark.date, date),
        eq(trackingMark.itemType, itemType),
        eq(trackingMark.itemKey, item.key),
      ),
    )
    .run();
}

export function getDayMarks(
  db: AppDatabase,
  accountId: string,
  date: string,
): DayMarks {
  const rows = db
    .select()
    .from(trackingMark)
    .where(and(eq(trackingMark.userId, accountId), eq(trackingMark.date, date)))
    .all();

  const keysOf = (itemType: ItemType) =>
    new Set(
      rows.filter((row) => row.itemType === itemType).map((row) => row.itemKey),
    );

  return { exercises: keysOf("exercise"), meals: keysOf("meal") };
}

export function exerciseCompletionMessage(ticked: Set<string>): string {
  return SAMPLE_EXERCISES.every(({ key }) => ticked.has(key))
    ? WORDING.today.allExercisesTicked
    : WORDING.today.someExercisesUnticked;
}

/** Checks a submitted note. Line endings are normalized, and nothing else changes. */
export function readNote(value: unknown): NoteInput {
  const text = typeof value === "string" ? value.replace(/\r\n/g, "\n") : "";
  return text.length > NOTE_MAX_LENGTH
    ? { ok: false, message: WORDING.today.noteTooLong }
    : { ok: true, text };
}

export function getNote(
  db: AppDatabase,
  accountId: string,
  date: string,
): string {
  const row = db
    .select()
    .from(dayNote)
    .where(and(eq(dayNote.userId, accountId), eq(dayNote.date, date)))
    .get();
  return row?.text ?? "";
}

/** Saves a note as written. A blank note clears the day's note instead. */
export function saveNote(
  db: AppDatabase,
  accountId: string,
  date: string,
  text: string,
): void {
  if (text.trim() === "") {
    db.delete(dayNote)
      .where(and(eq(dayNote.userId, accountId), eq(dayNote.date, date)))
      .run();
    return;
  }

  db.insert(dayNote)
    .values({ userId: accountId, date, text })
    .onConflictDoUpdate({
      target: [dayNote.userId, dayNote.date],
      set: { text },
    })
    .run();
}

function byListOrder(itemType: ItemType) {
  const position = (key: string) => {
    const index = sampleItems(itemType).findIndex((item) => item.key === key);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
  };
  return (a: { itemKey: string }, b: { itemKey: string }) =>
    position(a.itemKey) - position(b.itemKey);
}

/** Past days with a mark or a note, newest first, not including today. */
export function getHistory(
  db: AppDatabase,
  accountId: string,
  today: string,
): HistoryDay[] {
  const marks = db
    .select()
    .from(trackingMark)
    .where(and(eq(trackingMark.userId, accountId), lt(trackingMark.date, today)))
    .all();
  const notes = db
    .select()
    .from(dayNote)
    .where(and(eq(dayNote.userId, accountId), lt(dayNote.date, today)))
    .all();

  const dates = new Set([
    ...marks.map((mark) => mark.date),
    ...notes.map((note) => note.date),
  ]);

  const namesFor = (date: string, itemType: ItemType) =>
    marks
      .filter((mark) => mark.date === date && mark.itemType === itemType)
      .sort(byListOrder(itemType))
      .map((mark) => mark.itemName);

  return [...dates]
    .sort()
    .reverse()
    .map((date) => ({
      date,
      exercises: namesFor(date, "exercise"),
      meals: namesFor(date, "meal"),
      note: notes.find((note) => note.date === date)?.text ?? null,
    }));
}
