"use client";

import { useEffect } from "react";

/**
 * The sections on this page stream in after the browser has already looked for
 * the link's target, so this scrolls to it once they exist.
 */
export function ScrollToHash() {
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  return null;
}
