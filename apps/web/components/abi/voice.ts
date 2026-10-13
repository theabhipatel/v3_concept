"use client";

// Push-to-talk: browser records -> Groq Whisper (via the agent) -> ABI -> browser speech.
// Recordings are sent once for transcription and never stored.
import { useSyncExternalStore } from "react";
import { abi, PTT_RELEASE } from "./abi-store";

const CONSENT_KEY = "abi-mic-ok";
const MAX_MS = 30_000;

let needsConsent = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((s) => s());

export function useNeedsConsent() {
  return useSyncExternalStore(
    (s) => {
      subs.add(s);
      return () => subs.delete(s);
    },
    () => needsConsent,
    () => false,
  );
}

function hasConsent() {
  try {
    return sessionStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

let recorder: MediaRecorder | null = null;
let stream: MediaStream | null = null;
let chunks: Blob[] = [];
let startedAt = 0;
let stopTimer: number | undefined;
let onText: (text: string) => void = () => {};
let onInterrupt: () => void = () => {};

export function configureVoice(handlers: { onText: (text: string) => void; onInterrupt: () => void }) {
  onText = handlers.onText;
  onInterrupt = handlers.onInterrupt;
}

export const voiceSupported = () =>
  typeof window !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";

export function grantConsent() {
  try {
    sessionStorage.setItem(CONSENT_KEY, "1");
  } catch {}
  needsConsent = false;
  emit();
  void startListening();
}

export function declineConsent() {
  needsConsent = false;
  emit();
}

export async function startListening() {
  if (recorder) return;
  stopSpeaking();
  onInterrupt();
  if (!voiceSupported()) return;
  if (!hasConsent()) {
    needsConsent = true;
    emit();
    return;
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch {
    abi.setVoice({ listening: false });
    return;
  }
  chunks = [];
  recorder = new MediaRecorder(stream);
  recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  recorder.onstop = finish;
  recorder.start();
  startedAt = performance.now();
  abi.setVoice({ listening: true, caption: "" });
  stopTimer = window.setTimeout(stopListening, MAX_MS);
}

export function stopListening() {
  window.clearTimeout(stopTimer);
  if (recorder?.state === "recording") recorder.stop();
}

export function toggleListening() {
  if (recorder) stopListening();
  else void startListening();
}

async function finish() {
  const type = recorder?.mimeType || "audio/webm";
  const duration = performance.now() - startedAt;
  stream?.getTracks().forEach((t) => t.stop());
  recorder = null;
  stream = null;
  abi.setVoice({ listening: false });
  if (duration < 400 || !chunks.length) return;

  abi.setVoice({ caption: "Transcribing..." });
  const form = new FormData();
  form.append("audio", new Blob(chunks, { type }), `speech.${type.includes("mp4") ? "mp4" : "webm"}`);
  try {
    const res = await fetch("/api/agent/transcribe", { method: "POST", body: form });
    const data = await res.json();
    abi.setVoice({ caption: "" });
    if (res.ok && data.text) onText(data.text);
    else abi.setVoice({ caption: data.detail || "I couldn't hear that. Please try again or type." });
  } catch {
    abi.setVoice({ caption: "Voice is resting right now. Please type your question." });
  }
}

if (typeof window !== "undefined") window.addEventListener(PTT_RELEASE, stopListening);

// ---------- Speech out (browser Web Speech API, free) ----------

function speakable(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\|.*\|$/gm, " ")
    .replace(/\[(\d+)\]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_`#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function speak(markdown: string) {
  if (!("speechSynthesis" in window)) return;
  const text = speakable(markdown);
  if (!text) return;
  window.speechSynthesis.cancel();
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => /en-(US|GB|IN)/.test(v.lang) && /natural|google|samantha|aria/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en"));
  sentences.forEach((sentence, i) => {
    const u = new SpeechSynthesisUtterance(sentence.trim());
    if (voice) u.voice = voice;
    u.rate = 1.03;
    u.onstart = () => abi.setVoice({ speaking: true, caption: sentence.trim() });
    if (i === sentences.length - 1) u.onend = () => abi.setVoice({ speaking: false, caption: "" });
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  abi.setVoice({ speaking: false, caption: "" });
}
