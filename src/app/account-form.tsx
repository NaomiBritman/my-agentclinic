"use client";

import { useActionState } from "react";

import { WORDING } from "@/lib/wording";

import type { AccountFormState } from "./account-actions";

type AccountFormProps = {
  action: (
    state: AccountFormState,
    formData: FormData,
  ) => Promise<AccountFormState>;
  submitLabel: string;
  passwordAutoComplete: "new-password" | "current-password";
  passwordHelp?: string;
};

const INITIAL_STATE: AccountFormState = { message: "", email: "" };

const inputClasses =
  "mt-1 w-full rounded-md border border-foreground/30 bg-background px-3 py-2 text-base";

export function AccountForm({
  action,
  submitLabel,
  passwordAutoComplete,
  passwordHelp,
}: AccountFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block font-medium">
          {WORDING.accounts.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClasses}
        />
      </div>
      <div>
        <label htmlFor="password" className="block font-medium">
          {WORDING.accounts.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          aria-describedby={passwordHelp ? "password-help" : undefined}
          className={inputClasses}
        />
        {passwordHelp ? (
          <p id="password-help" className="mt-1 text-sm opacity-80">
            {passwordHelp}
          </p>
        ) : null}
      </div>
      {state.message ? (
        <p role="alert" className="font-medium">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60 sm:w-auto"
      >
        {submitLabel}
      </button>
    </form>
  );
}
