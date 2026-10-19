"use client";

// Who is signed in and their power settings, shared by the header, settings page and ABI's
// runtime without React. Normal visitors never trigger a request: /api/me is only called once
// this browser has signed in before (a small flag in localStorage).
import { useSyncExternalStore } from "react";
import type { PowerSettings } from "@/lib/openai-models";

export interface PowerUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface State {
  ready: boolean;
  user: PowerUser | null;
  power: PowerSettings | null;
  googleEnabled: boolean;
}

const FLAG = "abi-signed-in";
const initial: State = { ready: false, user: null, power: null, googleEnabled: false };
let state = initial;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function set(patch: Partial<State>) {
  state = { ...state, ...patch };
  if (typeof document !== "undefined") document.documentElement.dataset.power = isPowered() ? "on" : "off";
  listeners.forEach((l) => l());
}

function flag(on?: boolean) {
  try {
    if (on === undefined) return localStorage.getItem(FLAG) === "1";
    if (on) localStorage.setItem(FLAG, "1");
    else localStorage.removeItem(FLAG);
  } catch {}
  return false;
}

/** Signed in, with a saved key and the power switch on: ABI runs on the user's OpenAI key. */
export function isPowered() {
  return Boolean(state.user && state.power?.enabled && state.power.hasKey);
}

export const powerStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  /** Load the session. force = ask the server even if this browser never signed in. */
  load(force = false) {
    if (!force && !flag()) {
      if (!state.ready) set({ ready: true });
      return Promise.resolve();
    }
    loading ??= fetch("/api/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        flag(Boolean(d.user));
        set({ ready: true, user: d.user, power: d.power, googleEnabled: Boolean(d.googleEnabled) });
      })
      .catch(() => set({ ready: true }))
      .finally(() => (loading = null));
    return loading;
  },
  setPower: (power: PowerSettings) => set({ power }),
  signedOut() {
    flag(false);
    set({ user: null, power: null });
  },
};

export function usePower<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(powerStore.subscribe, () => selector(state), () => selector(initial));
}
