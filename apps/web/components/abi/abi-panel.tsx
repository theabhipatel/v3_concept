"use client";

import { Maximize2, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AbiChat } from "./abi-chat";
import { abi, useAbi } from "./abi-store";

/** The ABI side panel (full screen on phones). Non-modal, so ABI can operate the page beside it. */
export function AbiPanel() {
  const open = useAbi((s) => s.open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && abi.close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <aside
      aria-label="ABI (Abhi's Brain Interface)"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed inset-0 z-[60] flex flex-col bg-popover text-popover-foreground transition-[transform,opacity] duration-(--duration-base) ease-out-expo md:inset-auto md:bottom-28 md:right-7 md:top-6 md:w-[420px] md:rounded-3xl md:border md:shadow-lg",
        open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <span className="abi-orb abi-orb--active relative size-8 shrink-0 rounded-full" aria-hidden>
          <span className="abi-orb__core" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">ABI</p>
          <p className="truncate text-xs text-muted-foreground">Abhi&apos;s Brain Interface</p>
        </div>
        <Link href="/abi" onClick={() => abi.close()} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open full screen">
          <Maximize2 className="size-4" aria-hidden />
        </Link>
        <button type="button" onClick={() => abi.close()} className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close ABI">
          <X className="size-4" aria-hidden />
        </button>
      </header>
      <div className="min-h-0 flex-1">{open && <AbiChat />}</div>
    </aside>
  );
}
