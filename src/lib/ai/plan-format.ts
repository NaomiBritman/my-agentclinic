import type {
  AerobicItem,
  ExerciseDay,
  ExerciseMonth,
  Menu,
  MenuDay,
  MenuIngredient,
  MenuMeal,
  StrengthItem,
} from "../safety/types";

/**
 * The structured formats the agent must return. Everything it returns is
 * untrusted, so these parsers refuse wrong types, unknown fields and overlong
 * text before the safety checks look at the amounts. Length limits are technical
 * limits, not health numbers.
 */
const MAX_KEY_LENGTH = 60;
const MAX_NAME_LENGTH = 80;
const MAX_PORTION_LENGTH = 40;
const MAX_LIST_LENGTH = 20;

const integer = { type: "integer" };
const shortText = { type: "string" };

export const EXERCISE_MONTH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["weeks"],
  properties: {
    weeks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["days"],
        properties: {
          days: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["day", "aerobic", "strength"],
              properties: {
                day: integer,
                aerobic: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["exerciseKey", "minutes", "intensity"],
                    properties: {
                      exerciseKey: shortText,
                      minutes: integer,
                      intensity: shortText,
                    },
                  },
                },
                strength: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["exerciseKey", "sets", "repetitions", "loadKg"],
                    properties: {
                      exerciseKey: shortText,
                      sets: integer,
                      repetitions: integer,
                      loadKg: { type: ["number", "null"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

export const MENU_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["days", "expectedWeeklyLossKg"],
  properties: {
    expectedWeeklyLossKg: { type: ["number", "null"] },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "meals"],
        properties: {
          day: integer,
          meals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "calories", "ingredients"],
              properties: {
                name: shortText,
                calories: { type: "number" },
                ingredients: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "portion"],
                    properties: { name: shortText, portion: shortText },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

type UnknownRecord = Record<string, unknown>;

/** Thrown inside the parsers, and caught only by them. */
class FormatError extends Error {}

function record(value: unknown, fields: readonly string[]): UnknownRecord {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new FormatError();
  }
  const keys = Object.keys(value);
  if (
    keys.length !== fields.length ||
    keys.some((key) => !fields.includes(key))
  ) {
    throw new FormatError();
  }
  return value as UnknownRecord;
}

function list(value: unknown): unknown[] {
  if (!Array.isArray(value) || value.length > MAX_LIST_LENGTH) {
    throw new FormatError();
  }
  return value;
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FormatError();
  }
  return value;
}

function nullableNumber(value: unknown): number | null {
  return value === null ? null : number(value);
}

function text(value: unknown, maxLength: number): string {
  if (typeof value !== "string" || value.trim() === "" || value.length > maxLength) {
    throw new FormatError();
  }
  return value;
}

function parseAerobic(value: unknown): AerobicItem {
  const item = record(value, ["exerciseKey", "minutes", "intensity"]);
  return {
    exerciseKey: text(item.exerciseKey, MAX_KEY_LENGTH),
    minutes: number(item.minutes),
    intensity: text(item.intensity, MAX_KEY_LENGTH),
  };
}

function parseStrength(value: unknown): StrengthItem {
  const item = record(value, ["exerciseKey", "sets", "repetitions", "loadKg"]);
  return {
    exerciseKey: text(item.exerciseKey, MAX_KEY_LENGTH),
    sets: number(item.sets),
    repetitions: number(item.repetitions),
    loadKg: nullableNumber(item.loadKg),
  };
}

function parseExerciseDay(value: unknown): ExerciseDay {
  const day = record(value, ["day", "aerobic", "strength"]);
  return {
    day: number(day.day),
    aerobic: list(day.aerobic).map(parseAerobic),
    strength: list(day.strength).map(parseStrength),
  };
}

/** Returns the checked shape, or null for anything else. */
export function parseExerciseMonth(value: unknown): ExerciseMonth | null {
  try {
    return {
      weeks: list(record(value, ["weeks"]).weeks).map((week) => ({
        days: list(record(week, ["days"]).days).map(parseExerciseDay),
      })),
    };
  } catch (error) {
    if (error instanceof FormatError) return null;
    throw error;
  }
}

function parseIngredient(value: unknown): MenuIngredient {
  const ingredient = record(value, ["name", "portion"]);
  return {
    name: text(ingredient.name, MAX_NAME_LENGTH),
    portion: text(ingredient.portion, MAX_PORTION_LENGTH),
  };
}

function parseMeal(value: unknown): MenuMeal {
  const meal = record(value, ["name", "calories", "ingredients"]);
  return {
    name: text(meal.name, MAX_NAME_LENGTH),
    calories: number(meal.calories),
    ingredients: list(meal.ingredients).map(parseIngredient),
  };
}

function parseMenuDay(value: unknown): MenuDay {
  const day = record(value, ["day", "meals"]);
  return { day: number(day.day), meals: list(day.meals).map(parseMeal) };
}

/** Returns the checked shape, or null for anything else. */
export function parseMenu(value: unknown): Menu | null {
  try {
    const menu = record(value, ["days", "expectedWeeklyLossKg"]);
    const loss = nullableNumber(menu.expectedWeeklyLossKg);
    return {
      days: list(menu.days).map(parseMenuDay),
      ...(loss === null ? {} : { expectedWeeklyLossKg: loss }),
    };
  } catch (error) {
    if (error instanceof FormatError) return null;
    throw error;
  }
}
