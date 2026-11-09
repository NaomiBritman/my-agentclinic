"use client";

import { useOptimistic, useTransition } from "react";

import type { ItemType, SampleItem } from "@/lib/samples";

import { setMarkAction } from "./actions";

function TrackingItem({
  itemType,
  item,
  marked,
}: {
  itemType: ItemType;
  item: SampleItem;
  marked: boolean;
}) {
  const [optimisticMarked, setOptimisticMarked] = useOptimistic(marked);
  const [, startTransition] = useTransition();

  return (
    <li>
      <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-2 transition-colors hover:bg-chip-teal has-[:checked]:border-action has-[:checked]:bg-chip-teal">
        <input
          type="checkbox"
          name={item.key}
          checked={optimisticMarked}
          onChange={(event) => {
            const next = event.target.checked;
            startTransition(async () => {
              setOptimisticMarked(next);
              await setMarkAction(itemType, item.key, next);
            });
          }}
          className="tick size-6 shrink-0"
        />
        <span>{item.name}</span>
      </label>
    </li>
  );
}

export function TrackingList({
  itemType,
  items,
  marked,
}: {
  itemType: ItemType;
  items: readonly SampleItem[];
  marked: string[];
}) {
  return (
    <ul className="mt-4 space-y-2">
      {items.map((item) => (
        <TrackingItem
          key={item.key}
          itemType={itemType}
          item={item}
          marked={marked.includes(item.key)}
        />
      ))}
    </ul>
  );
}
