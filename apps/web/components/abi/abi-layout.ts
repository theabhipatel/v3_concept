"use client";

// How the ABI panel is shown: docked as a resizable sidebar, floating as a window, or full
// screen. Remembered per visitor in localStorage (a convenience only; defaults always work).
import { useSyncExternalStore } from "react";

export type AbiMode = "dock" | "float" | "full";

export interface AbiLayout {
  mode: AbiMode;
  /** Docked sidebar width in px. */
  width: number;
  /** Floating window position; null = default corner. */
  x: number | null;
  y: number | null;
}

const KEY = "abi-layout";
export const DEFAULT_WIDTH = 440;
export const MIN_WIDTH = 340;
const defaults: AbiLayout = { mode: "dock", width: DEFAULT_WIDTH, x: null, y: null };

function load(): AbiLayout {
  if (typeof window === "undefined") return defaults;
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return defaults;
  }
}

let state = load();
const listeners = new Set<() => void>();

export const abiLayout = {
  get: () => state,
  /** Update the layout; `persist: false` during a drag, then persist once on release. */
  set(patch: Partial<AbiLayout>, persist = true) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
    if (persist) abiLayout.save();
  },
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage can be blocked; the layout still works for this visit.
    }
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function maxWidth() {
  return Math.max(MIN_WIDTH, Math.min(960, Math.round(window.innerWidth * 0.7)));
}

export function clampWidth(w: number) {
  return Math.round(Math.min(maxWidth(), Math.max(MIN_WIDTH, w)));
}

export function useAbiLayout() {
  return useSyncExternalStore(abiLayout.subscribe, abiLayout.get, () => defaults);
}

const WIDE = "(min-width: 768px)";
function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** True on tablet and desktop; phones always get the full-screen panel. */
export function useWideScreen() {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
}
