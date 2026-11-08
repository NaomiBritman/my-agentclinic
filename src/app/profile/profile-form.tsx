"use client";

import { useActionState } from "react";

import {
  FITNESS_LEVELS,
  GOALS,
  type ProfileField,
  type ProfileFormInput,
} from "@/lib/profile-validation";
import { WORDING } from "@/lib/wording";

import { saveProfileAction, type ProfileFormState } from "./actions";

const fieldClasses =
  "mt-1 w-full rounded-md border border-foreground/30 bg-background px-3 py-2 text-base";

function FieldError({
  field,
  state,
}: {
  field: ProfileField;
  state: ProfileFormState;
}) {
  const error = state.errors[field];
  return error ? (
    <p id={`${field}-error`} role="alert" className="mt-1 font-medium">
      {error}
    </p>
  ) : null;
}

function NumberField({
  field,
  label,
  inputMode,
  state,
}: {
  field: ProfileField;
  label: string;
  inputMode: "numeric" | "decimal";
  state: ProfileFormState;
}) {
  return (
    <div>
      <label htmlFor={field} className="block font-medium">
        {label}
      </label>
      {/* A text input, so the browser adds no minimum, maximum or step. */}
      <input
        id={field}
        name={field}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        required
        defaultValue={state.values[field]}
        aria-invalid={state.errors[field] ? true : undefined}
        aria-describedby={state.errors[field] ? `${field}-error` : undefined}
        className={fieldClasses}
      />
      <FieldError field={field} state={state} />
    </div>
  );
}

function ChoiceField({
  field,
  label,
  options,
  state,
}: {
  field: ProfileField;
  label: string;
  options: { value: string; label: string }[];
  state: ProfileFormState;
}) {
  return (
    <div>
      <label htmlFor={field} className="block font-medium">
        {label}
      </label>
      {/* The key restores the choice after React resets the form. */}
      <select
        key={state.values[field]}
        id={field}
        name={field}
        required
        defaultValue={state.values[field]}
        aria-invalid={state.errors[field] ? true : undefined}
        aria-describedby={state.errors[field] ? `${field}-error` : undefined}
        className={fieldClasses}
      >
        <option value="">{WORDING.profile.choose}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError field={field} state={state} />
    </div>
  );
}

export function ProfileForm({ initial }: { initial: ProfileFormInput }) {
  const [state, formAction, pending] = useActionState(saveProfileAction, {
    values: initial,
    errors: {},
    saved: false,
  });

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <NumberField
        field="age"
        label={WORDING.profile.ageLabel}
        inputMode="numeric"
        state={state}
      />
      <NumberField
        field="heightCm"
        label={WORDING.profile.heightLabel}
        inputMode="decimal"
        state={state}
      />
      <NumberField
        field="weightKg"
        label={WORDING.profile.weightLabel}
        inputMode="decimal"
        state={state}
      />
      <ChoiceField
        field="fitnessLevel"
        label={WORDING.profile.fitnessLevelLabel}
        options={FITNESS_LEVELS.map((value) => ({
          value,
          label: WORDING.profile.fitnessLevels[value],
        }))}
        state={state}
      />
      <ChoiceField
        field="goal"
        label={WORDING.profile.goalLabel}
        options={GOALS.map((value) => ({
          value,
          label: WORDING.profile.goals[value],
        }))}
        state={state}
      />
      <p className="opacity-80">{WORDING.profile.goalNote}</p>
      {state.saved ? (
        <p role="status" className="font-medium">
          {WORDING.profile.saved}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60 sm:w-auto"
      >
        {WORDING.profile.saveButton}
      </button>
    </form>
  );
}
