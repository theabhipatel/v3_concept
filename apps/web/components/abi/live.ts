"use client";

// Live conversation: a hands-free loop. The browser listens continuously and a voice activity
// detector (Silero VAD, running locally in the browser) notices when the visitor starts and
// stops talking. Each finished sentence goes to Groq Whisper, then ABI acts and speaks, then
// listens again. Audio never leaves the browser except that one transcription request.
import type { MicVAD } from "@ricky0123/vad-web";
import { abi } from "./abi-store";
import { VAD_ASSET_PATH } from "./vad-assets";
import { currentVoice, stopSpeaking } from "./voice";

// Model and WASM files are self-hosted in public/vad/ (see scripts/copy-vad-assets.mjs),
// versioned and cached for a year, and warmed in the background on page load (VadPrefetch).
const VAD_ASSETS = VAD_ASSET_PATH;
const ORT_WASM = VAD_ASSET_PATH;
const SAMPLE_RATE = 16000;

let vad: MicVAD | null = null;
let starting = false;
/** Each heard sentence starts a new turn; an older turn that is still finishing steps aside. */
let turn = 0;
/** True while ABI speaks with the mic still open, so the visitor can cut in. */
let bargeIn = false;

// Normal listening, and a stricter setting while ABI talks (only clear, sustained speech
// interrupts it, not leftover echo or a cough).
const LISTEN = { positiveSpeechThreshold: 0.6, negativeSpeechThreshold: 0.45, minSpeechMs: 300 };
const WHILE_SPEAKING = { positiveSpeechThreshold: 0.85, negativeSpeechThreshold: 0.6, minSpeechMs: 450 };
let onText: (text: string) => Promise<void> = async () => {};

export function configureLive(handler: (text: string) => Promise<void>) {
  onText = handler;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isLive = () => abi.get().live !== "off" && abi.get().live !== "error";

/** 16-bit mono WAV from the VAD's Float32 samples (what Whisper accepts). */
function toWav(samples: Float32Array) {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const str = (o: number, s: string) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, "data");
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((v, i) => view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v)) * 0x7fff, true));
  return new Blob([buffer], { type: "audio/wav" });
}

async function transcribe(samples: Float32Array) {
  const form = new FormData();
  form.append("audio", toWav(samples), "speech.wav");
  const res = await fetch("/api/agent/transcribe", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || "transcription failed");
  return String(data.text ?? "").trim();
}

/** Wait until ABI has finished speaking (speech starts a moment after the answer arrives). */
async function untilQuiet(id: number) {
  await sleep(400);
  const start = performance.now();
  let listening = false;
  while (isLive() && id === turn && performance.now() - start < 120_000) {
    if (!window.speechSynthesis?.speaking && !abi.get().speaking) break;
    // Groq's voice plays in the page, so echo cancellation keeps it out of the mic: listen for
    // the visitor cutting in. The browser's own voice would be heard as the visitor, so not then.
    if (!listening && vad && currentVoice() === "groq") {
      listening = true;
      bargeIn = true;
      vad.setOptions(WHILE_SPEAKING);
      await vad.start();
    }
    await sleep(120);
  }
  bargeIn = false;
  vad?.setOptions(LISTEN);
}

async function resumeListening() {
  if (!vad || !isLive()) return;
  abi.setVoice({ caption: "" });
  if (abi.get().live !== "hearing") abi.setLive("listening"); // the visitor may already be talking
  await vad.start();
}

async function onUtterance(samples: Float32Array) {
  if (!vad || !isLive()) return;
  const id = ++turn;
  bargeIn = false;
  stopSpeaking(); // the visitor spoke: anything ABI was still saying is over
  await vad.pause(); // no listening while ABI thinks; it reopens while ABI speaks
  vad.setOptions(LISTEN);
  abi.setLive("thinking");
  try {
    const text = await transcribe(samples);
    if (id !== turn) return;
    if (!text || !isLive()) return void (await resumeListening());
    await onText(text);
    if (!isLive() || id !== turn) return;
    abi.setLive("speaking");
    await untilQuiet(id);
  } catch {
    if (id !== turn) return;
    abi.setVoice({ caption: "I didn't catch that. Try again." });
    await sleep(1200);
  }
  if (id === turn) await resumeListening();
}

export async function startLive() {
  if (vad || starting) return;
  starting = true;
  stopSpeaking();
  abi.setLive("starting");
  try {
    const { MicVAD } = await import("@ricky0123/vad-web");
    const instance = await MicVAD.new({
      model: "v5",
      baseAssetPath: VAD_ASSETS,
      onnxWASMBasePath: ORT_WASM,
      redemptionMs: 900, // pause length that ends a sentence
      preSpeechPadMs: 300,
      startOnLoad: false,
      getStream: () =>
        navigator.mediaDevices.getUserMedia({
          audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }),
      ...LISTEN,
      onSpeechStart: () => {
        if (!bargeIn) abi.setLive("hearing");
      },
      // Sustained speech while ABI talks: stop talking and hear the visitor out.
      onSpeechRealStart: () => {
        if (!bargeIn) return;
        bargeIn = false;
        stopSpeaking();
        abi.setLive("hearing");
      },
      onVADMisfire: () => {
        if (isLive() && !bargeIn && abi.get().live === "hearing") abi.setLive("listening");
      },
      onSpeechEnd: (audio) => void onUtterance(audio),
    });
    if (!isLive()) {
      await instance.destroy();
      return;
    }
    vad = instance;
    await resumeListening();
  } catch {
    abi.setLive("error");
    abi.setVoice({ caption: "I couldn't use the microphone. Check the browser permission and try again." });
  } finally {
    starting = false;
  }
}

/** Skip the rest of ABI's spoken answer and listen again. */
export function interruptLive() {
  stopSpeaking();
}

async function teardown() {
  const v = vad;
  vad = null;
  stopSpeaking();
  abi.setVoice({ caption: "" });
  await v?.destroy().catch(() => undefined);
}

// Ending live mode from anywhere (the End button, closing the panel) releases the microphone.
abi.subscribe(() => {
  if (abi.get().live === "off" && vad) void teardown();
});
