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

// ---------- Speech out ----------
// First choice: Groq's natural voice (Orpheus), played inside the page so the browser's echo
// cancellation can hear it. Fallback, always free: the browser's own Web Speech voice. Groq's
// free tier is small, so after any failure the browser voice is used for a while.

const GROQ_COOLDOWN_MS = 60_000; // the agent tracks Groq's own wait; this just avoids retrying every sentence
const MAX_PART = 190; // Groq accepts up to 200 characters per request
let groqOffUntil = 0;
let playId = 0;
let audio: HTMLAudioElement | null = null;
let endAudio: (() => void) | null = null;
let voiceMode: "groq" | "browser" | null = null;

/**
 * Which voice is speaking. "groq" plays inside the page, so the browser's echo cancellation
 * removes it from the microphone and live mode can keep listening (barge-in). "browser" speech
 * comes from the operating system and would be heard as the visitor, so the mic pauses.
 */
export const currentVoice = () => voiceMode;

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

/** Split text into as few parts as possible (each request costs free quota), at sentence ends. */
function parts(text: string) {
  const out: string[] = [];
  let cur = "";
  const pieces = (text.match(/[^.!?]+[.!?]*\s*/g) ?? [text]).flatMap((sentence) => {
    if (sentence.length <= MAX_PART) return [sentence];
    // Rare very long sentence: break at commas or spaces.
    return sentence.match(new RegExp(`.{1,${MAX_PART}}(\\s|,|$)`, "g")) ?? [sentence.slice(0, MAX_PART)];
  });
  for (const p of pieces) {
    if ((cur + p).trim().length > MAX_PART) {
      if (cur.trim()) out.push(cur.trim());
      cur = p;
    } else cur += p;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

async function fetchVoice(text: string) {
  const res = await fetch(`/api/agent/speak?text=${encodeURIComponent(text)}`);
  if (!res.ok) throw new Error(`speak ${res.status}`);
  return URL.createObjectURL(await res.blob());
}

/** Play one clip; resolves true when it finished, false if it could not play. */
function playClip(url: string) {
  return new Promise<boolean>((resolve) => {
    const a = new Audio(url);
    audio = a;
    endAudio = () => resolve(true);
    a.onended = () => resolve(true);
    a.onerror = () => resolve(false);
    a.play().catch(() => resolve(false));
  });
}

async function speakGroq(text: string, id: number) {
  voiceMode = "groq";
  const list = parts(text);
  abi.setVoice({ speaking: true, caption: list[0] });
  let next = fetchVoice(list[0]);
  for (let i = 0; i < list.length; i++) {
    const url = await next.catch(() => null);
    if (id !== playId) {
      if (url) URL.revokeObjectURL(url);
      return;
    }
    if (i + 1 < list.length) next = fetchVoice(list[i + 1]); // fetch ahead while this one plays
    const ok = url ? (abi.setVoice({ speaking: true, caption: list[i] }), await playClip(url)) : false;
    if (url) URL.revokeObjectURL(url);
    if (id !== playId) return;
    if (!ok) {
      // Groq is unavailable (or the clip could not play): the browser voice finishes the answer.
      groqOffUntil = Date.now() + GROQ_COOLDOWN_MS;
      next.then((u) => URL.revokeObjectURL(u), () => undefined);
      speakBrowser(list.slice(i).join(" "));
      return;
    }
  }
  audio = null;
  voiceMode = null;
  abi.setVoice({ speaking: false, caption: "" });
}

/** The free fallback: the browser's own speech engine, sentence by sentence with captions. */
function speakBrowser(text: string) {
  voiceMode = "browser";
  if (!("speechSynthesis" in window)) return abi.setVoice({ speaking: false, caption: "" });
  window.speechSynthesis.cancel();
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => /en-(US|GB|IN)/.test(v.lang) && /natural|google|samantha|aria/i.test(v.name)) ??
    voices.find((v) => v.lang.startsWith("en"));
  abi.setVoice({ speaking: true, caption: sentences[0].trim() });
  sentences.forEach((sentence, i) => {
    const u = new SpeechSynthesisUtterance(sentence.trim());
    if (voice) u.voice = voice;
    u.rate = 1.03;
    u.onstart = () => abi.setVoice({ speaking: true, caption: sentence.trim() });
    if (i === sentences.length - 1)
      u.onend = u.onerror = () => {
        voiceMode = null;
        abi.setVoice({ speaking: false, caption: "" });
      };
    window.speechSynthesis.speak(u);
  });
}

export function speak(markdown: string) {
  const text = speakable(markdown);
  if (!text) return;
  stopSpeaking();
  const id = ++playId;
  if (Date.now() < groqOffUntil || typeof Audio === "undefined") speakBrowser(text);
  else void speakGroq(text, id);
}

export function stopSpeaking() {
  playId++;
  voiceMode = null;
  if (audio) {
    audio.pause();
    audio = null;
  }
  endAudio?.();
  endAudio = null;
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  abi.setVoice({ speaking: false, caption: "" });
}
