"use client";

import { useActionState } from "react";

import {
  buttonClasses,
  fieldClasses,
  FormMessage,
  helpClasses,
  labelClasses,
  Notice,
} from "@/components/ui";
import {
  FITNESS_LEVELS,
  GOALS,
  type ProfileField,
  type ProfileFormInput,
} from "@/lib/profile-validation";
import { WORDING } from "@/lib/wording";

import { saveProfileAction, type ProfileFormState } from "./actions";

function FieldError({
  field,
  state,
}: {
  field: ProfileField;
  state: ProfileFormState;
}) {
  const error = state.errors[field];
  return error ? (
    <FormMessage tone="error" id={`${field}-error`}>
      {error}
    </FormMessage>
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
      <label htmlFor={field} className={labelClasses}>
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
      <label htmlFor={field} className={labelClasses}>
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

function AnswerField({
  field,
  question,
  state,
}: {
  field: "eatingDisorderAnswer" | "medicalConditionAnswer";
  question: string;
  state: ProfileFormState;
}) {
  const options = [
    { value: "yes", label: WORDING.eligibility.yes },
    { value: "no", label: WORDING.eligibility.no },
  ];

  return (
    // The key restores the choice after React resets the form.
    <fieldset
      key={state.values[field]}
      aria-describedby={state.errors[field] ? `${field}-error` : undefined}
    >
      <legend className="font-medium">{question}</legend>
      <div className="mt-2 flex gap-3">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex min-h-11 min-w-24 cursor-pointer items-center gap-2 rounded-xl border border-control px-4 py-2 transition-colors hover:bg-chip-teal has-[:checked]:border-action has-[:checked]:bg-chip-teal has-[:checked]:font-semibold"
          >
            <input
              type="radio"
              name={field}
              value={option.value}
              required
              defaultChecked={state.values[field] === option.value}
              className="tick tick-round size-5 shrink-0"
            />
            {option.label}
          </label>
        ))}
      </div>
      <FieldError field={field} state={state} />
    </fieldset>
  );
}

export function ProfileForm({
  initial,
  initialMessage,
}: {
  initial: ProfileFormInput;
  initialMessage: string | null;
}) {
  const [state, formAction, pending] = useActionState(saveProfileAction, {
    values: initial,
    errors: {},
    saved: false,
    eligibilityMessage: initialMessage,
  });

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
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
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>
      <p className={helpClasses}>{WORDING.profile.goalNote}</p>
      <div className="space-y-5 border-t border-line pt-5">
        <AnswerField
          field="eatingDisorderAnswer"
          question={WORDING.eligibility.eatingDisorderQuestion}
          state={state}
        />
        <AnswerField
          field="medicalConditionAnswer"
          question={WORDING.eligibility.medicalConditionQuestion}
          state={state}
        />
      </div>
      {state.eligibilityMessage ? (
        <Notice>{state.eligibilityMessage}</Notice>
      ) : null}
      {state.saved ? (
        <FormMessage tone="done">{WORDING.profile.saved}</FormMessage>
      ) : null}
      <button type="submit" disabled={pending} className={buttonClasses}>
        {WORDING.profile.saveButton}
      </button>
    </form>
  );
}
