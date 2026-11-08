export type SampleItem = { key: string; name: string };

export type ItemType = "exercise" | "meal";

// Fixed samples, the same for every person and every day. Names only, with no
// amounts or foods. They aren't linked to the profile or goal.
export const SAMPLE_EXERCISES: readonly SampleItem[] = [
  { key: "walking", name: "Walking" },
  { key: "stretching", name: "Stretching" },
  { key: "wall-push-ups", name: "Wall push-ups" },
  { key: "chair-squats", name: "Chair squats" },
];

export const SAMPLE_MEALS: readonly SampleItem[] = [
  { key: "breakfast", name: "Breakfast" },
  { key: "lunch", name: "Lunch" },
  { key: "dinner", name: "Dinner" },
  { key: "snack", name: "Snack" },
];

export function sampleItems(itemType: ItemType): readonly SampleItem[] {
  return itemType === "exercise" ? SAMPLE_EXERCISES : SAMPLE_MEALS;
}
