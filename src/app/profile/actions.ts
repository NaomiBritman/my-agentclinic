"use server";

import { getDatabase } from "@/db/database";
import { requireAccount } from "@/lib/auth-server";
import { getEligibilityMessage } from "@/lib/plan-access";
import {
  validateProfile,
  type ProfileErrors,
  type ProfileField,
  type ProfileFormInput,
} from "@/lib/profile-validation";
import { saveProfile } from "@/lib/profiles";

export type ProfileFormState = {
  values: ProfileFormInput;
  errors: ProfileErrors;
  saved: boolean;
  eligibilityMessage: string | null;
};

function readField(formData: FormData, field: ProfileField): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function saveProfileAction(
  previous: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  // The account always comes from the session, never from the form.
  const account = await requireAccount();

  const values: ProfileFormInput = {
    age: readField(formData, "age"),
    heightCm: readField(formData, "heightCm"),
    weightKg: readField(formData, "weightKg"),
    fitnessLevel: readField(formData, "fitnessLevel"),
    goal: readField(formData, "goal"),
    eatingDisorderAnswer: readField(formData, "eatingDisorderAnswer"),
    medicalConditionAnswer: readField(formData, "medicalConditionAnswer"),
  };

  const result = validateProfile(values);
  if (!result.ok) {
    return {
      values,
      errors: result.errors,
      saved: false,
      eligibilityMessage: previous.eligibilityMessage,
    };
  }

  saveProfile(getDatabase(), account.id, result.values);
  return {
    values,
    errors: {},
    saved: true,
    eligibilityMessage: getEligibilityMessage(result.values),
  };
}
