"use client";

import { useActionState } from "react";

import {
  buttonClasses,
  fieldClasses,
  FormMessage,
  helpClasses,
  labelClasses,
} from "@/components/ui";
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

export function AccountForm({
  action,
  submitLabel,
  passwordAutoComplete,
  passwordHelp,
}: AccountFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className={labelClasses}>
          {WORDING.accounts.emailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={fieldClasses}
        />
      </div>
      <div>
        <label htmlFor="password" className={labelClasses}>
          {WORDING.accounts.passwordLabel}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={passwordAutoComplete}
          required
          aria-describedby={passwordHelp ? "password-help" : undefined}
          className={fieldClasses}
        />
        {passwordHelp ? (
          <p id="password-help" className={helpClasses}>
            {passwordHelp}
          </p>
        ) : null}
      </div>
      {state.message ? (
        <FormMessage tone="error">{state.message}</FormMessage>
      ) : null}
      <button type="submit" disabled={pending} className={buttonClasses}>
        {submitLabel}
      </button>
    </form>
  );
}
