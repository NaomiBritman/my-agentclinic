"use client";

import { useState } from "react";

import { buttonClasses, secondaryButtonClasses } from "@/components/ui";
import { WORDING } from "@/lib/wording";

import { startOverAction } from "./actions";

export function StartOver() {
  const [asking, setAsking] = useState(false);

  if (!asking) {
    return (
      <button
        type="button"
        onClick={() => setAsking(true)}
        className={secondaryButtonClasses}
      >
        {WORDING.testPlans.startOver}
      </button>
    );
  }

  return (
    <form action={startOverAction} className="space-y-3">
      <p role="status" className="font-medium">
        {WORDING.testPlans.startOverQuestion}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button type="submit" className={buttonClasses}>
          {WORDING.testPlans.startOverConfirm}
        </button>
        <button
          type="button"
          onClick={() => setAsking(false)}
          className={secondaryButtonClasses}
        >
          {WORDING.testPlans.startOverCancel}
        </button>
      </div>
    </form>
  );
}
