"use client";

import { useActionState } from "react";

import { WORDING } from "@/lib/wording";

import { saveNoteAction } from "./actions";

export function NoteForm({
  initial,
  maxLength,
}: {
  initial: string;
  maxLength: number;
}) {
  const [state, formAction, pending] = useActionState(saveNoteAction, {
    text: initial,
    message: "",
    saved: false,
  });

  return (
    <form action={formAction} className="mt-8">
      <label htmlFor="note" className="block font-medium">
        {WORDING.today.noteLabel}
      </label>
      <p id="note-help" className="mt-1 text-sm opacity-80">
        {WORDING.today.noteHelp}
      </p>
      <textarea
        id="note"
        name="note"
        rows={4}
        maxLength={maxLength}
        defaultValue={state.text}
        aria-describedby="note-help"
        className="mt-2 w-full rounded-md border border-foreground/30 bg-background px-3 py-2 text-base"
      />
      {state.message ? (
        <p role="alert" className="mt-2 font-medium">
          {state.message}
        </p>
      ) : null}
      {state.saved ? (
        <p role="status" className="mt-2 font-medium">
          {WORDING.today.noteSaved}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60 sm:w-auto"
      >
        {WORDING.today.noteSaveButton}
      </button>
    </form>
  );
}
