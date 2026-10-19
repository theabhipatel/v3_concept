"use client";

// Tiny dependency-free store so any page can open ABI or queue a question without loading the
// AI code. The chat module (loaded on first interaction) consumes the queue.
import { useSyncExternalStore } from "react";

export interface AbiRequest {
  id: number;
  text: string;
  voice?: boolean;
}

interface AbiState {
  open: boolean;
  /** Set once the visitor interacts with ABI; triggers loading of the chat module. */
  activated: boolean;
  queue: AbiRequest[];
  /** Push-to-talk requested before the chat module loaded. */
  listenRequested: boolean;
  listening: boolean;
  speaking: boolean;
  /** Sentence ABI is currently speaking (live captions). */
  caption: string;
  /** "Paste a job description" mode for the chat input. */
  jdMode: boolean;
  /** Live conversation (hands-free voice loop) state. */
  live: LiveState;
  liveRequested: boolean;
  /** A saved conversation to reopen (signed-in users). */
  resumeRequested: string | null;
  /** The visitor's voice settings for ABI (remembered in this browser). */
  voiceMuted: boolean;
  voiceRate: number;
}

const PREFS_KEY = "abi-voice";

function savedVoice(): Pick<AbiState, "voiceMuted" | "voiceRate"> {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    return { voiceMuted: v.muted === true, voiceRate: typeof v.rate === "number" ? v.rate : 1 };
  } catch {
    return { voiceMuted: false, voiceRate: 1 };
  }
}

export type LiveState = "off" | "starting" | "listening" | "hearing" | "thinking" | "speaking" | "error";

const initial: AbiState = {
  open: false,
  activated: false,
  queue: [],
  listenRequested: false,
  listening: false,
  speaking: false,
  caption: "",
  jdMode: false,
  live: "off",
  liveRequested: false,
  resumeRequested: null,
  voiceMuted: false,
  voiceRate: 1,
};
let state: AbiState = typeof window === "undefined" ? initial : { ...initial, ...savedVoice() };
const listeners = new Set<() => void>();
let nextId = 1;

function set(patch: Partial<AbiState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const abi = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  activate: () => set({ activated: true }),
  open: () => set({ open: true, activated: true }),
  close: () => set({ open: false }),
  toggle: () => set({ open: !state.open, activated: true }),
  /** Open ABI and send a question. */
  ask(text: string, voice = false) {
    set({ open: true, activated: true, queue: [...state.queue, { id: nextId++, text, voice }] });
  },
  take(): AbiRequest[] {
    const q = state.queue;
    if (q.length) set({ queue: [] });
    return q;
  },
  requestJd: () => set({ open: true, activated: true, jdMode: true }),
  setJdMode: (jdMode: boolean) => set({ jdMode }),
  requestListen: () => set({ open: true, activated: true, listenRequested: true }),
  /** Start the hands-free live conversation (loads the voice detector on first use). */
  startLive: () => set({ open: true, activated: true, liveRequested: true }),
  clearLiveRequest: () => set({ liveRequested: false }),
  setLive: (live: LiveState) => set({ live }),
  /** End the live conversation; the live module tears down the microphone. */
  stopLive: () => set({ live: "off", liveRequested: false }),
  clearListen: () => set({ listenRequested: false }),
  /** Reopen a saved conversation in the panel. */
  resume: (id: string) => set({ open: true, activated: true, resumeRequested: id }),
  /** Mute or unmute ABI's voice, or change its speed (0.75 to 1.5). */
  setVoicePrefs(patch: { muted?: boolean; rate?: number }) {
    const next = {
      voiceMuted: patch.muted ?? state.voiceMuted,
      voiceRate: Math.min(1.5, Math.max(0.75, patch.rate ?? state.voiceRate)),
    };
    set(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ muted: next.voiceMuted, rate: next.voiceRate }));
    } catch {}
  },
  clearResume: () => set({ resumeRequested: null }),
  setVoice: (patch: Partial<Pick<AbiState, "listening" | "speaking" | "caption">>) => set(patch),
};

/** Fired when push-to-talk is released (Space key up or mic button released). */
export const PTT_RELEASE = "abi:ptt-release";

export function useAbi<T>(selector: (s: AbiState) => T): T {
  return useSyncExternalStore(
    abi.subscribe,
    () => selector(state),
    () => selector(initial),
  );
}

/** Continue a saved conversation: the agent keeps its memory under this id. */
export function setSessionId(id: string) {
  try {
    sessionStorage.setItem("abi-session", id);
  } catch {}
}

export function getSessionId(): string {
  const key = "abi-session";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `s_${crypto.randomUUID().replace(/-/g, "")}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return `s_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  }
}
