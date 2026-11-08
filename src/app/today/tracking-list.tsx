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
      <label className="flex cursor-pointer items-center gap-3 py-2">
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
          className="size-5 shrink-0"
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
    <ul className="mt-3">
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
