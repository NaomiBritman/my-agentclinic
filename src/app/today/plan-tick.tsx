"use client";

import { useOptimistic, useTransition, type ReactNode } from "react";

import { WORDING } from "@/lib/wording";

import { setLoadMarkAction, setPlanMarkAction } from "./plan-actions";

const rowClasses =
  "flex min-h-12 items-center gap-3 rounded-xl px-4 py-2";

/**
 * One plan item. Only today's items can be ticked, and the details stay outside
 * the label, so that long ingredient lists aren't read out as the tick's name.
 */
export function PlanTick({
  itemKey,
  title,
  summary,
  marked,
  readOnly,
  loadMark,
  children,
}: {
  itemKey: string;
  title: string;
  summary: string;
  marked: boolean;
  readOnly: boolean;
  /** Present for loaded exercises. */
  loadMark?: { marked: boolean };
  children?: ReactNode;
}) {
  const [optimisticMarked, setOptimisticMarked] = useOptimistic(marked);
  const [optimisticLoad, setOptimisticLoad] = useOptimistic(
    loadMark?.marked ?? false,
  );
  const [, startTransition] = useTransition();

  return (
    <li className="rounded-xl border border-line has-[:checked]:border-action">
      <label
        className={`${rowClasses} ${
          readOnly ? "" : "cursor-pointer transition-colors hover:bg-chip-teal"
        }`}
      >
        <input
          type="checkbox"
          name={itemKey}
          checked={optimisticMarked}
          disabled={readOnly}
          onChange={(event) => {
            const next = event.target.checked;
            startTransition(async () => {
              setOptimisticMarked(next);
              if (!next) setOptimisticLoad(false);
              await setPlanMarkAction(itemKey, next);
            });
          }}
          className="tick size-6 shrink-0 disabled:cursor-not-allowed"
        />
        <span className="min-w-0">
          <span className="block font-medium">{title}</span>
          <span className="block text-muted">{summary}</span>
        </span>
      </label>

      {children ? <div className="px-4 pb-3">{children}</div> : null}

      {loadMark && (optimisticMarked || loadMark.marked) ? (
        <label
          className={`${rowClasses} border-t border-line ${
            readOnly ? "" : "cursor-pointer transition-colors hover:bg-chip-teal"
          }`}
        >
          <input
            type="checkbox"
            name={`${itemKey}:load`}
            checked={optimisticLoad}
            disabled={readOnly}
            onChange={(event) => {
              const next = event.target.checked;
              startTransition(async () => {
                setOptimisticLoad(next);
                await setLoadMarkAction(itemKey, next);
              });
            }}
            className="tick size-6 shrink-0 disabled:cursor-not-allowed"
          />
          <span>{WORDING.daily.loadMark}</span>
        </label>
      ) : null}
    </li>
  );
}
