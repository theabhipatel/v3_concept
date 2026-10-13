"use client";

import dynamic from "next/dynamic";
import { Search } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

// The dialog (cmdk + project list) loads only when first opened.
const PaletteDialog = dynamic(() => import("./palette-dialog"), { ssr: false });

let paletteOpen = false;
const subs = new Set<() => void>();
export function setPaletteOpen(open: boolean) {
  paletteOpen = open;
  subs.forEach((s) => s());
}
const subscribe = (s: () => void) => {
  subs.add(s);
  return () => subs.delete(s);
};

export function CommandPalette() {
  const open = useSyncExternalStore(subscribe, () => paletteOpen, () => false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return open ? <PaletteDialog onClose={() => setPaletteOpen(false)} /> : null;
}

export function PaletteTrigger() {
  return (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      className="hidden h-10 items-center gap-2 rounded-full border bg-card/70 pl-3 pr-2 text-sm text-muted-foreground shadow-sm backdrop-blur transition-colors hover:text-foreground sm:inline-flex"
    >
      <Search className="size-4" aria-hidden />
      <span>Search or ask</span>
      <kbd className="rounded-full border bg-muted px-2 py-0.5 font-mono text-[11px]">Ctrl K</kbd>
    </button>
  );
}
