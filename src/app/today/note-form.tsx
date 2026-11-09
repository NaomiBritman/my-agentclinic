"use client";

import { useActionState } from "react";

import {
  buttonClasses,
  fieldClasses,
  FormMessage,
  helpClasses,
} from "@/components/ui";
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
    <form action={formAction}>
      <label htmlFor="note" className="block text-xl font-semibold">
        {WORDING.today.noteLabel}
      </label>
      <p id="note-help" className={helpClasses}>
        {WORDING.today.noteHelp}
      </p>
      <textarea
        id="note"
        name="note"
        rows={4}
        maxLength={maxLength}
        defaultValue={state.text}
        aria-describedby="note-help"
        className={`${fieldClasses} mt-3`}
      />
      {state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      {state.saved ? (
        <FormMessage tone="done">{WORDING.today.noteSaved}</FormMessage>
      ) : null}
      <button type="submit" disabled={pending} className={`${buttonClasses} mt-3`}>
        {WORDING.today.noteSaveButton}
      </button>
    </form>
  );
}
