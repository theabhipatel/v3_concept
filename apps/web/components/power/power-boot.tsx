"use client";

import { useEffect } from "react";
import { powerStore } from "./power-store";

/** Restores a signed-in power user's session after the page is idle (no cost for visitors). */
export function PowerBoot() {
  useEffect(() => {
    const id = window.setTimeout(() => void powerStore.load(), 400);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
