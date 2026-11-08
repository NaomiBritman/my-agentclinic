"use server";

import { refresh } from "next/cache";

import { getDatabase } from "@/db/database";
import { requireAccountWithProfile } from "@/lib/auth-server";
import { localDate } from "@/lib/dates";
import { findSampleItem, readNote, saveNote, setMark } from "@/lib/tracking";

export type NoteFormState = { text: string; message: string; saved: boolean };

// The account comes from the session and the date from this computer's clock.
// Neither is ever taken from the browser.

export async function setMarkAction(
  itemType: unknown,
  itemKey: unknown,
  marked: unknown,
): Promise<void> {
  const account = await requireAccountWithProfile();

  const found = findSampleItem(itemType, itemKey);
  if (!found || typeof marked !== "boolean") return;

  setMark(
    getDatabase(),
    account.id,
    localDate(),
    found.itemType,
    found.item,
    marked,
  );
  refresh();
}

export async function saveNoteAction(
  _previous: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const account = await requireAccountWithProfile();

  const submitted = formData.get("note");
  const note = readNote(submitted);
  if (!note.ok) {
    return {
      text: typeof submitted === "string" ? submitted : "",
      message: note.message,
      saved: false,
    };
  }

  saveNote(getDatabase(), account.id, localDate(), note.text);
  return { text: note.text, message: "", saved: true };
}
