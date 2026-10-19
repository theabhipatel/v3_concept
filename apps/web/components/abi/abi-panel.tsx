"use client";

import { Maximize2, PanelRight, PictureInPicture2, Volume2, VolumeX, X, type LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AbiBot } from "./abi-bot";
import { AbiChat } from "./abi-chat";
import {
  abiLayout,
  clampWidth,
  DEFAULT_WIDTH,
  maxWidth,
  MIN_WIDTH,
  useAbiLayout,
  useWideScreen,
  type AbiMode,
} from "./abi-layout";
import { abi, useAbi } from "./abi-store";

const MODES: { id: AbiMode; label: string; icon: LucideIcon }[] = [
  { id: "dock", label: "Dock to the side", icon: PanelRight },
  { id: "float", label: "Float as a window", icon: PictureInPicture2 },
  { id: "full", label: "Full screen", icon: Maximize2 },
];

const FLOAT_W = 420;
const MARGIN = 12;

function floatHeight() {
  return Math.min(640, window.innerHeight - 2 * MARGIN);
}

/** Keep the floating window's header on screen. */
function clampPos(x: number, y: number, w: number) {
  return {
    x: Math.round(Math.min(window.innerWidth - w - MARGIN, Math.max(MARGIN, x))),
    y: Math.round(Math.min(window.innerHeight - 64, Math.max(MARGIN, y))),
  };
}

/** Drag helper: pointer capture on the handle, `persist` once on release. */
function drag(e: React.PointerEvent<HTMLElement>, onMove: (ev: PointerEvent) => void, cursor: string) {
  e.preventDefault();
  const el = e.currentTarget;
  el.setPointerCapture(e.pointerId);
  const root = document.documentElement;
  root.classList.add("abi-dragging");
  root.style.setProperty("--abi-drag-cursor", cursor);
  const end = () => {
    el.removeEventListener("pointermove", onMove);
    el.removeEventListener("pointerup", end);
    el.removeEventListener("pointercancel", end);
    root.classList.remove("abi-dragging");
    abiLayout.save();
  };
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

/**
 * The ABI panel. Docked: a resizable sidebar that pushes the page aside. Floating: a window
 * you can drag and resize. Full screen: takes over the view. Phones always use full screen.
 * Non-modal, so ABI can operate the page beside it.
 */
export function AbiPanel() {
  const open = useAbi((s) => s.open);
  const listening = useAbi((s) => s.listening);
  const speaking = useAbi((s) => s.speaking);
  const live = useAbi((s) => s.live);
  const muted = useAbi((s) => s.voiceMuted);
  const layout = useAbiLayout();
  const wide = useWideScreen();
  const mode: AbiMode = wide ? layout.mode : "full";
  const docked = open && mode === "dock";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      // Esc closes ABI, unless it is closing something on top first (search, menu).
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][data-state="open"], .orb-backdrop--open')) return;
      abi.close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Docked: push the page aside by the panel width (body padding + fixed UI read --abi-dock).
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--abi-dock", docked ? `${clampWidth(layout.width)}px` : "0px");
    return () => root.style.setProperty("--abi-dock", "0px");
  }, [docked, layout.width]);

  // Keep the docked width valid when the window shrinks.
  useEffect(() => {
    const onResize = () => abiLayout.set({ width: clampWidth(abiLayout.get().width) }, false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const width = clampWidth(layout.width);
  const pos =
    mode === "float"
      ? clampPos(layout.x ?? window.innerWidth - FLOAT_W - 28, layout.y ?? 72, FLOAT_W)
      : null;

  const style: React.CSSProperties =
    mode === "dock" ? { width } : mode === "float" && pos ? { left: pos.x, top: pos.y, width: FLOAT_W, height: floatHeight() } : {};

  return (
    <aside
      aria-label="ABI (Abhi's Brain Interface)"
      aria-hidden={!open}
      inert={!open}
      data-mode={mode}
      style={style}
      className={cn(
        "fixed z-60 flex flex-col bg-popover text-popover-foreground ease-out-expo",
        mode === "dock" && "inset-y-0 right-0 border-l shadow-lg transition-transform duration-300",
        mode === "float" &&
          "min-h-90 min-w-80 max-h-[calc(100dvh-24px)] max-w-[calc(100vw-24px)] resize overflow-hidden rounded-2xl border shadow-2xl transition-[opacity,scale] duration-200",
        mode === "full" && "inset-0 transition-[opacity,scale] duration-200",
        open
          ? "translate-x-0 scale-100 opacity-100"
          : cn("pointer-events-none", mode === "dock" ? "translate-x-full" : "scale-95 opacity-0"),
      )}
    >
      {mode === "dock" && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize ABI panel"
          aria-valuenow={width}
          aria-valuemin={MIN_WIDTH}
          aria-valuemax={open ? maxWidth() : undefined}
          tabIndex={0}
          title="Drag to resize, double-click to reset"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            drag(e, (ev) => abiLayout.set({ width: clampWidth(window.innerWidth - ev.clientX) }, false), "col-resize");
          }}
          onDoubleClick={() => abiLayout.set({ width: DEFAULT_WIDTH })}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 80 : 24;
            if (e.key === "ArrowLeft") abiLayout.set({ width: clampWidth(width + step) });
            else if (e.key === "ArrowRight") abiLayout.set({ width: clampWidth(width - step) });
            else return;
            e.preventDefault();
          }}
          className="group absolute inset-y-0 -left-2 z-10 w-4 cursor-col-resize touch-none outline-none"
        >
          <span className="absolute inset-y-0 left-1/2 w-px bg-transparent transition-colors group-hover:bg-brand group-focus-visible:bg-brand" />
          <span className="absolute left-1/2 top-1/2 h-12 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border-strong transition-colors group-hover:bg-brand group-focus-visible:bg-brand" />
        </div>
      )}

      <header
        onPointerDown={(e) => {
          // Floating: drag the window by its header (but not by its buttons).
          if (mode !== "float" || e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
          const start = clampPos(layout.x ?? window.innerWidth - FLOAT_W - 28, layout.y ?? 72, FLOAT_W);
          const dx = e.clientX - start.x;
          const dy = e.clientY - start.y;
          const w = (e.currentTarget.parentElement as HTMLElement).offsetWidth;
          drag(e, (ev) => abiLayout.set(clampPos(ev.clientX - dx, ev.clientY - dy, w), false), "grabbing");
        }}
        className={cn(
          "flex shrink-0 items-center gap-3 border-b px-4 py-3",
          mode === "float" && "cursor-grab touch-none select-none",
          mode === "full" && "sm:px-6",
        )}
      >
        <AbiBot state={listening || live === "hearing" ? "listening" : speaking ? "speaking" : "active"} size={36} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-semibold">ABI</p>
          <p className="truncate text-xs text-muted-foreground">Abhi&apos;s Brain Interface</p>
        </div>
        {wide && (
          <div role="group" aria-label="Panel layout" className="flex items-center gap-0.5 rounded-full border bg-background/60 p-0.5">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-label={m.label}
                  aria-pressed={active}
                  title={m.label}
                  onClick={() => abiLayout.set({ mode: m.id })}
                  className={cn(
                    "grid size-8 place-items-center rounded-full transition-colors",
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </button>
              );
            })}
          </div>
        )}
        <button
          type="button"
          onClick={() => abi.setVoicePrefs({ muted: !muted })}
          aria-pressed={muted}
          title={muted ? "Unmute ABI's voice" : "Mute ABI's voice"}
          className={cn(
            "grid size-9 place-items-center rounded-full transition-colors hover:bg-accent hover:text-foreground",
            muted ? "text-brand-text" : "text-muted-foreground",
          )}
          aria-label={muted ? "Unmute ABI's voice" : "Mute ABI's voice"}
        >
          {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={() => {
            abi.stopLive();
            abi.close();
          }}
          className="grid size-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label="Close ABI"
        >
          <X className="size-4" aria-hidden />
        </button>
      </header>
      <div className={cn("min-h-0 flex-1", mode === "full" && "mx-auto w-full max-w-4xl")}>{open && <AbiChat />}</div>
    </aside>
  );
}
